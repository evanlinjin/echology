#!/usr/bin/env bash

source ./deploy/config.sh
# cargo build -r || exit 1

export ECHO_BLOCKTIME
export ECHO_BIND
export ECHO_BITCOIND_RPC
export ECHO_BITCOIND_COOKIE
cargo run -r
# ./target/release/echology
