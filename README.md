# CAMV

[![Build Status](https://img.shields.io/travis/white-lab/CAMV.svg)](https://travis-ci.org/white-lab/CAMV)
[![Build status](https://ci.appveyor.com/api/projects/status/iva4po0glnswboc1?svg=true)](https://ci.appveyor.com/project/naderm/camv)
[![Dependency Status](https://gemnasium.com/badges/github.com/white-lab/CAMV.svg)](https://gemnasium.com/github.com/white-lab/CAMV)

Tool for validation proteomic mass spectrometry peptide assignments.

## Usage

To download CAMV, visit our [releases](https://github.com/white-lab/CAMV/releases)
page and select the version appropriate for your system.

CAMV can either directly process ProteomeDiscoverer or MASCOT search data on
Windows, or open previously-processed data sets on non-Windows computers.
[This platform restriction is due to proprietary vendor libraries](http://proteowizard.sourceforge.net/formats/index.html))
as we depend on those libraries to read the raw mass spectrometry data.

After opening your processed CAMV file, you should see a list of proteins with
individual spectra that can be accepted or rejected:

![CAMV - pY](https://i.imgur.com/5Bsj995.png)

### Shortcuts

CAMV supports several shortcuts for navigating a data set:

```
Down / j: Down in tree
Up / k: Up in tree
Left / Right: Expand / collapse tree
n / m: Next / Previous Spectrum
a: Accept spectra
s: Maybe spectra
d: Reject spectra
Control-O: Open Data Set
Control-E: Export Data Set
Control-F: Search proteins / peptides / scans
```

## Development

### Dependencies

You will first need to [install Node.js v7](https://nodejs.org/en/) as
well as [git](https://git-scm.com/) (for `bower`).


Once those are installed, run:

```
npm install
npm install bower -g
bower install
```

### Usage

From this directory, run:

```
npm start
# or
npm run start-dev
```

### Deployment

From this directory, run:

```
npm run make
```

This will generate a zip using in `./out/make/` for your current platform.
The full suite of Windows / OS X / Linux builds are created on tagged releases
using [AppVeyor](https://github.com/white-lab/CAMV/blob/master/appveyor.yml) and
[Travis-CI](https://github.com/white-lab/CAMV/blob/master/.travis.yml).
