# ThomWright.github.io

## Developing

### Dependencies

For running locally:

* nodejs
* ruby (v2.0)
* bundler

```bash
gem install bundler
bundle install
```

### Updating the Gemfile.lock

Try: `./scripts/run-script-in-docker.sh update-gem-lock.sh`

I don't have the patience to figure out how to run Ruby locally, so I'm just mounting the files into a Docker container.

### Running

On your machine:

`jekyll serve --drafts --baseurl ''`

Or in a VM (see `./provision/bootstrap.sh` for more details):

`vagrant up` - TODO how to use this?

Or in Docker:

`docker-compose up` - you might need to remove the `Gemfile.lock` (ugh)
