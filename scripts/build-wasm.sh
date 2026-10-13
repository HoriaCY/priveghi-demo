#!/bin/sh
# Builds the rules engine to WebAssembly into pkg/ (gitignored). Paths under $HOME are remapped
# so no local path is baked into the binary's panic strings.
set -eu
cd "$(dirname "$0")/.."
RUSTFLAGS="--remap-path-prefix=$HOME=~ ${RUSTFLAGS:-}" \
  wasm-pack build crates/priveghi-engine --target web --release --out-dir ../../pkg --no-pack
