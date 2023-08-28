#!/usr/bin/env bash

source ./deploy/config.sh

ORIGINAL_PWD=$(pwd)
revert_state() {
    cd "${ORIGINAL_PWD}"
}
trap revert_state SIGINT SIGTERM EXIT

cd ui
npm run build || exit 1
npm run start || exit 1
