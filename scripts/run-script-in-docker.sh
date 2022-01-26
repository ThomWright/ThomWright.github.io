#!/usr/bin/env bash

set -o errexit
set -o pipefail
set -o nounset
# set -o xtrace

docker run --rm --volume "$PWD":/usr/src/app \
  --workdir /usr/src/app \
  ruby:2.7 \
  ./scripts/"$1"
