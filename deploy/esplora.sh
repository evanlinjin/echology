#!/usr/bin/env bash

source ./deploy/config.sh

ORIGINAL_PWD=$(pwd)
revert_state() {
    cd "${ORIGINAL_PWD}"
    rm -rf esplora
}
trap revert_state SIGINT SIGTERM EXIT

export API_URL="${ELECTRS_URL}"
export SITE_TITLE="Echology Explorer"
export CORS_ALLOW="*"
# export STATIC_ROOT=http://localhost:5000/ # for loading CSS, images and fonts

git clone https://github.com/evanlinjin/esplora || exit 1
cd esplora || exit 1
npm install || exit 1
npm run dist || exit 1
npm run dev-server
