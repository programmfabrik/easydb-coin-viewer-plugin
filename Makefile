PLUGIN_NAME = easydb-coin-viewer-plugin

EASYDB_LIB = easydb-library

L10N_FILES = l10n/$(PLUGIN_NAME).csv
L10N_GOOGLE_KEY = 1Z3UPJ6XqLBp-P8SUf-ewq4osNJ3iZWKJB83tc6Wrfn0
L10N_GOOGLE_GID = 740940252

INSTALL_FILES = \
	$(WEB)/l10n/cultures.json \
	$(WEB)/l10n/de-DE.json \
	$(WEB)/l10n/en-US.json \
	$(WEB)/l10n/es-ES.json \
	$(WEB)/l10n/it-IT.json \
	$(CSS) \
	$(JS) \
	manifest.yml

SCSS_FILES = src/webfrontend/scss/easydb-coin-viewer-plugin.scss
COFFEE_FILES = src/webfrontend/CoinViewerDetailPlugin.coffee
COIN_LIB_FILE = src/lib/coin.js

all: build

include $(EASYDB_LIB)/tools/base-plugins.make

${JS}: $(subst .coffee,.coffee.js,${COFFEE_FILES}) ${COIN_LIB_FILE}
	mkdir -p $(dir $@)
	cat $^ > $@

build: code $(L10N) buildinfojson

code: $(JS) css

clean: clean-base

wipe: wipe-base

zip: build
	mkdir -p zip/$(PLUGIN_NAME)
	cp -r build zip/$(PLUGIN_NAME)/
	cp manifest.yml zip/$(PLUGIN_NAME)/
	(cd zip; zip - -r . > ../$(PLUGIN_NAME).zip)
	rm -r zip/
