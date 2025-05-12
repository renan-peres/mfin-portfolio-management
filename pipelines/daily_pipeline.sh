#!/bin/bash
#
# Portfolio Management Pipeline Orchestrator
# This script manages the execution of Jupyter notebooks in sequence
# and handles errors gracefully.
#

# Exit immediately if a command exits with a non-zero status
set -e

# Enable debugging with -x flag (uncomment if needed)
# set -x

##############################################################################
# HELPER FUNCTIONS
##############################################################################

log() {
    local message=$1
    local timestamp=$(date "+%Y-%m-%d %H:%M:%S")
    echo "[$timestamp] $message"
}

check_dependency() {
    local cmd=$1
    if ! command -v "$cmd" &> /dev/null; then
        log "❌ Required dependency not found: $cmd"
        exit 1
    fi
}

##############################################################################
# DUCKDB SETUP
##############################################################################

setup_duckdb() {
    log "Setting up DuckDB..."
    
    # Check if DuckDB is already installed
    if command -v duckdb &> /dev/null; then
        log "✅ DuckDB is already installed."
        duckdb --version
        return 0
    fi
    
    log "Installing DuckDB..."
    curl https://install.duckdb.org | sh
    
    # Add DuckDB to PATH and verify installation
    DUCKDB_PATH="$HOME/.duckdb/cli/latest"
    if [ -f "$DUCKDB_PATH/duckdb" ]; then
        log "Adding DuckDB to PATH..."
        export PATH="$DUCKDB_PATH:$PATH"
        log "✅ DuckDB installed successfully."
        $DUCKDB_PATH/duckdb --version
        return 0
    else
        log "❌ DuckDB installation failed."
        return 1
    fi
}

##############################################################################
# VARIABLES
##############################################################################

QUARTO_VERSION="1.6.39"
QUARTO_ARCH="linux-amd64"

# Update PATH for this session
export PATH="$PATH:$HOME/.local/bin"

##############################################################################
# QUARTO SETUP
##############################################################################

# Function to check Quarto version
check_quarto_version() {
    local CURRENT_QUARTO=$(which quarto 2>/dev/null)
    if [ -n "$CURRENT_QUARTO" ]; then
        local INSTALLED_VERSION=$("$CURRENT_QUARTO" --version 2>/dev/null)
        if [ "$INSTALLED_VERSION" = "$QUARTO_VERSION" ]; then
            log "✅ Quarto $QUARTO_VERSION is already installed."
            return 0
        fi
    fi
    return 1
}

# Function to check if we're in a virtual environment
in_virtualenv() {
    if [ -n "$VIRTUAL_ENV" ]; then
        return 0  # True
    else
        return 1  # False
    fi
}

setup_quarto() {
    log "Setting up Quarto..."
    
    # Install required packages for Quarto
    if in_virtualenv; then
        # Try to find the correct pip in the virtual environment
        local VENV_PIP=""
        
        # Check common virtual environment pip locations
        if [ -f "$VIRTUAL_ENV/bin/pip" ]; then
            VENV_PIP="$VIRTUAL_ENV/bin/pip"
        elif [ -f "$VIRTUAL_ENV/bin/pip3" ]; then
            VENV_PIP="$VIRTUAL_ENV/bin/pip3"
        elif [ -f "$(dirname "$VIRTUAL_ENV")/bin/pip" ]; then
            # Check if virtual env is inside a parent directory
            VENV_PIP="$(dirname "$VIRTUAL_ENV")/bin/pip"
        fi
        
        if [ -n "$VENV_PIP" ]; then
            log "Using virtual environment pip at: $VENV_PIP"
            "$VENV_PIP" install jupyter pyyaml
        else
            log "❌ Could not find virtual environment pip. Skipping package installation."
            log "Please manually install required packages: jupyter pyyaml"
            log "Try running: python -m pip install jupyter pyyaml"
            # Continue without failing - the script might still work if packages are installed
        fi
    else
        log "⚠️ Not running in a virtual environment."
        
        # Check if required packages are already installed
        python3 -c "import jupyter, yaml" &>/dev/null
        if [ $? -eq 0 ]; then
            log "✅ Required Python packages are already installed."
        else
            log "Required Python packages need to be installed."
            read -p "Do you want to create a new virtual environment? (y/n): " create_venv
            
            if [[ "$create_venv" == "y" || "$create_venv" == "Y" ]]; then
                log "Creating virtual environment..."
                python3 -m venv .venv
                source .venv/bin/activate
                python3 -m pip install jupyter pyyaml
                log "✅ Virtual environment created and packages installed."
            else
                log "Installing packages to user directory..."
                python3 -m pip install --user jupyter pyyaml
                if [ $? -ne 0 ]; then
                    log "❌ Failed to install packages."
                    log "You may need to install packages manually:"
                    log "  python3 -m pip install --user jupyter pyyaml"
                    read -p "Continue anyway? (y/n): " continue_anyway
                    if [[ "$continue_anyway" != "y" && "$continue_anyway" != "Y" ]]; then
                        exit 1
                    fi
                fi
            fi
        fi
    fi
    
    # If Quarto is not installed or version doesn't match, proceed with installation
    if ! check_quarto_version; then
        log "Installing Quarto $QUARTO_VERSION..."
        mkdir -p "$HOME/opt" "$HOME/.local/bin"
        curl -LO "https://github.com/quarto-dev/quarto-cli/releases/download/v${QUARTO_VERSION}/quarto-${QUARTO_VERSION}-${QUARTO_ARCH}.tar.gz"
        tar -xzf "quarto-${QUARTO_VERSION}-${QUARTO_ARCH}.tar.gz" -C "$HOME/opt"
        ln -sf "$HOME/opt/quarto-${QUARTO_VERSION}/bin/quarto" "$HOME/.local/bin/quarto"
        
        if ! grep -q "$HOME/.local/bin" "$HOME/.bashrc"; then
            echo 'export PATH="$PATH:$HOME/.local/bin"' >> "$HOME/.bashrc"
        fi
        
        # Verify installation
        quarto check || { log "❌ Quarto installation failed"; exit 1; }
        
        rm "quarto-${QUARTO_VERSION}-${QUARTO_ARCH}.tar.gz"
    fi
    
    # Print Quarto version for debugging
    quarto --version
}

##############################################################################
# NOTEBOOK FUNCTIONS
##############################################################################

# Function to validate the JSON structure of a notebook
validate_notebook() {
    local notebook=$1
    log "Validating JSON structure of $notebook..."
    if jq empty "$notebook" >/dev/null 2>&1; then
        log "✅ JSON structure of $notebook is valid."
        return 0
    else
        log "❌ JSON structure of $notebook is invalid."
        return 1
    fi
}

# Function to repair a corrupted notebook
repair_notebook() {
    local notebook=$1
    log "Attempting to repair $notebook..."
    
    # Validate the JSON structure
    if validate_notebook "$notebook"; then
        log "✅ Notebook $notebook appears valid. No repair needed."
        return 0
    fi

    # Attempt to convert the notebook to a Python script
    log "Converting $notebook to a Python script..."
    if jupyter nbconvert --to script "$notebook" --output "${notebook%.ipynb}.py"; then
        log "✅ Successfully converted $notebook to a Python script."
        log "Please manually review and recreate the notebook if needed."
        return 0
    else
        log "❌ Failed to convert $notebook to a Python script."
    fi

    # Create a placeholder notebook if all else fails
    log "Creating a placeholder notebook for $notebook..."
    cat <<EOF > "$notebook"
{
 "cells": [],
 "metadata": {},
 "nbformat": 4,
 "nbformat_minor": 5
}
EOF
    log "⚠️ Placeholder notebook created for $notebook. Please manually restore its content."
    return 1
}

# Function to run a notebook and check for errors
run_notebook() {
    local notebook=$1
    log "Running $notebook..."
    
    # First check if the notebook exists
    if [ ! -f "$notebook" ]; then
        log "❌ Notebook $notebook does not exist."
        return 1
    fi
    
    # Check if the notebook has valid JSON structure
    if ! validate_notebook "$notebook"; then
        log "❌ Notebook $notebook has invalid JSON structure. Attempting repair..."
        repair_notebook "$notebook" || return 1
    fi
    
    # Try to execute the notebook
    if jupyter nbconvert --to notebook --execute "$notebook" --inplace; then
        log "✅ Successfully completed $notebook"
    else
        log "❌ Error executing $notebook. This might be due to issues with the code inside the notebook."
        log "Please review the notebook manually."
        return 1
    fi
}

##############################################################################
# MAIN EXECUTION
##############################################################################

main() {
    log "===== Portfolio Management Pipeline ====="
    
    # Setup Quarto
    setup_quarto
    
    # Setup DuckDB
    setup_duckdb || exit 1
    
    log "Starting execution of notebooks in sequence..."
    
    # Execute notebooks in sequence
    log "Step 1/4: Scraping tickers..."
    run_notebook "data/loaders/scrape_tickers.ipynb" || exit 1
    
    log "Step 2/4: Scraping quotes..."
    run_notebook "data/loaders/scrape_quotes.ipynb" || exit 1

    log "Step 3/4: Fetching Quotes Datasets into a Single Dataset..."
    run_notebook "data/fetch_datasets.ipynb" || exit 1
    
    log "Step 4/4: Load .csv Files to DuckDB (data.db)..."
    if [ -f "data/duckdb_fetch_database.sh" ]; then
        chmod +x "data/duckdb_fetch_database.sh"
        ./data/duckdb_fetch_database.sh || exit 1
    else
        log "❌ DuckDB script not found: data/duckdb_fetch_database.sh"
        exit 1
    fi
    
    log "===== Pipeline completed successfully! ====="
}

# Execute the main function
main