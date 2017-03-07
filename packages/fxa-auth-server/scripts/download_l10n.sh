#!/bin/sh

if [ -n "$FXA_L10N_SKIP" ]; then
    echo "Skipping fxa-content-server-l10n update..."
    exit 0
fi

if [ -z "$FXA_L10N_SHA" ]; then
    FXA_L10N_SHA="master"
fi

DOWNLOAD_PATH="git://github.com/mozilla/fxa-content-server-l10n.git#$FXA_L10N_SHA"

echo "Downloading L10N files from $DOWNLOAD_PATH..."
# Download L10N using npm
npm install $DOWNLOAD_PATH
