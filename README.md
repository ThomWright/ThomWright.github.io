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

### Running

On your machine:

`jekyll serve --incremental --watch --drafts -H 127.0.0.1 -P 4000`

Or in a VM (see `./provision/bootstrap.sh` for more details):

`vagrant up` - TODO how to use this?

Or in Docker:

`docker-compose up`

Then go to `localhost:4000`.

### Updating the Gemfile.lock

```bash
docker run --rm \
  --volume="$PWD:/srv/jekyll" \
  -it jekyll/jekyll:4.2.0 \
  bundle update
```

### Generating the syntax highlighting styles

While running using docker-compose:

```bash
docker exec -it thomwrightgithubio_github-pages_1 bash
/usr/gem/bin/rougify style github > public/css/syntax/highlight.css
```
