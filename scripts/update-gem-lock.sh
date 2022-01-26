#!/usr/bin/env bash

set -o errexit
set -o pipefail
set -o nounset
# set -o xtrace

# Matches the version in Gemfile.lock
gem install bundler:1.16.3

bundle update
