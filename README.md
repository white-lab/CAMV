# CAMV

[![Build Status](https://img.shields.io/travis/naderm/CAMV.svg)](https://travis-ci.org/naderm/CAMV)

Tool for validation proteomic mass spectrometry peptide assignments.

# Dependencies

You will first need to [install the latest Node.js](https://nodejs.org/en/) as
well as [git](https://git-scm.com/) (for `bower`).


Once those are installed, from `src/` run:

```
npm install
bower install
```

# Usage

`node_modules/.bin/electron .` from `src/`

# Deployment

From this directory, run:

```
electron-packager src/ --all
```

This will generate fully-independent packages for Linux, Windows, and OS X. You
can also download automated builds of tagged releases from [this repository's
releases page](https://github.com/naderm/CAMV/releases).

# Testing

Choose `examples/testData.camv`
