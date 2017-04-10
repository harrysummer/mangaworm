NODE = `which node`
BABEL = node_modules/.bin/babel

ARGS := --help

SRCDIR = src
DISTDIR = dist

rwildcard = $(wildcard $1$2)
rwildcard += $(foreach d,$(wildcard $1*),$(call rwildcard,$d/,$2))

chprefix = $(addprefix $2/,$(3:$1/%=%))

SOURCES := $(call rwildcard,$(SRCDIR)/,*.js)
TARGETS := $(call chprefix,$(SRCDIR),$(DISTDIR),$(SOURCES))

.SUFFIXES:
.SUFFIXES: .js

.PHONY: all clean run
all: $(TARGETS)
clean:
	@rm -rf $(DISTDIR)
run: all
	$(NODE) $(DISTDIR)/index $(ARGS)

.SECONDEXPANSION:
PERCENT = %
$(TARGETS): %: $$(patsubst $(DISTDIR)/$$(PERCENT),$(SRCDIR)/$$(PERCENT),%)
	@mkdir -p $(dir $@)
	$(BABEL) -o $@ $<

