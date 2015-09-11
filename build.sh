#!/bin/sh
set -e

THEMES="cerulean cosmo cyborg darkly flatly journal lumen paper readable sandstone simplex slate spacelab superhero united yeti"

mkdir -p dist/themes

for THEME in $THEMES; do
    echo "Building theme $THEME"
    git checkout src/less/strapdown-bi.less
    sed s/_THEME_/$THEME/ -i src/less/strapdown-bi.less
    grunt
    mv dist/strapdown.css dist/themes/$THEME.css
done
