# ThomWright.github.io

## Developing

### Dependencies

For running locally, see the [Jekyll dependencies](https://jekyllrb.com/docs/installation/).

```bash
gem install bundler
bundle install
```

### Run

On your machine:

`jekyll serve --incremental --watch --drafts -H 127.0.0.1 -P 4000`

Prefix with `bundle exec` if you don't have `jekyll` installed and on your PATH.

### Generate the syntax highlighting styles

`rougify style github > public/css/syntax/highlight.css`
