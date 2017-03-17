# CAMV

[![Build Status](https://img.shields.io/travis/white-lab/CAMV.svg)](https://travis-ci.org/white-lab/CAMV)
[![Build status](https://ci.appveyor.com/api/projects/status/iva4po0glnswboc1?svg=true)](https://ci.appveyor.com/project/naderm/camv)

Tool for validation proteomic mass spectrometry peptide assignments.

## Usage

To download CAMV, visit our [releases](https://github.com/white-lab/CAMV/releases) page and select the version appropriate for your system.

Upon opening CAMV, you will be prompted to open a .camv.gz file. These are generated using [PyCAMVerter](https://github.com/white-lab/pycamverter), which is Windows-only ([due to proprietary vendor libraries](http://proteowizard.sourceforge.net/formats/index.html)) and must be run separately.

After opening your processed CAMV file, you should see a list of proteins with individual spectra that can be accepted or rejected:

![CAMV - pY](https://i.imgur.com/45Dv8eo.png)

### Shortcuts



## Development

### Dependencies

You will first need to [install the Node.js 7](https://nodejs.org/en/) as
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

This will generate a zip using in `./out/make/` for your current platform. The full suite of Windows / OS X / Linux builds are created on tagged releases using [AppVeyor](https://github.com/white-lab/CAMV/blob/master/appveyor.yml) and [Travis-CI](https://github.com/white-lab/CAMV/blob/master/.travis.yml)
