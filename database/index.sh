#!/bin/bash

# PostgreSQL connection details
USER="kyeou"
PASSWORD="q1w2e3r4!@#$"
HOST="localhost"
PORT="5432"
DATABASE="csun"

# Script files
SCRIPTS=("catalog.sql" "professor.sql" "routines.sql" "section.sql")

# Loop through the script files and execute them
for SCRIPT in "${SCRIPTS[@]}"
do
    echo "Running script: $SCRIPT"
    psql -U "$USER" -h "$HOST" -p "$PORT" -d "$DATABASE" -f "$SCRIPT"
    if [ $? -eq 0 ]; then
        echo "Script $SCRIPT executed successfully"
    else
        echo "Failed to execute script $SCRIPT"
        exit 1
    fi
done

echo "All scripts executed successfully"
