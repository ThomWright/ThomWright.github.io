#! /usr/bin/env bash

# Install packages
apt-get update -qq

# Install Node.js
curl -sL https://deb.nodesource.com/setup | sudo bash
apt-get install nodejs

# Install Ruby and Bundler
apt-get install ruby-full
gem install bundler

# Install Jekyll
cd /vagrant
bundle install

#
# idempotently add stuff to .profile
#
VAGRANT_HOME=/home/vagrant

cd $VAGRANT_HOME
if [ ! -f .profile_user ]; then
    # ensure we `vagrant ssh` into the project directory
    echo "cd $PROJECT_DIR" >> .profile_user
fi

if ! grep -q ".profile_user" $VAGRANT_HOME/.profile; then
  # If not already there, then append command to execute .profile_user to .profile
  echo "if [ -f $VAGRANT_HOME/.profile_user ]; then . $VAGRANT_HOME/.profile_user; fi" >> $VAGRANT_HOME/.profile
fi
source $VAGRANT_HOME/.profile

echo "Run 'jekyll serve --watch --drafts' or 'jekyll serve -wD' to serve the site on localhost:4000"
