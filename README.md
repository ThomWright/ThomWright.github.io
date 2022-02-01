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

`jekyll serve --drafts --baseurl ''`

Or in a VM (see `./provision/bootstrap.sh` for more details):

`vagrant up` - TODO how to use this?

Or in Docker:

`docker-compose up`

Then go to `localhost:4000`.

### Updating the Gemfile.lock

```bash
docker run --rm \
  --volume="$PWD:/srv/jekyll" \
  -it jekyll/jekyll:pages \
  bundle update
```

### Generating the syntax highlighting styles

While running using docker-compose:

```bash
docker exec -it thomwrightgithubio_github-pages_1 bash
/usr/gem/gems/rouge-3.27.0/bin/rougify style thankful_eyes > public/css/syntax/highlight.css
```
