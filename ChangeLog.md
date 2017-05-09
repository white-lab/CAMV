# Change Log

## 0.9.0 (2017-05-09)

Features

  - Improved display of peak labels, show lower peaks on zoom in.

## 0.8.0 (2017-05-09)

Features

  - Replaced Google Charts with d3 to render mass spectra, CAMV can now be used
    offline.

## 0.7.2 (2017-05-04)

Bug fixes

  - Don't refresh precursor / quant scans unnecessarily.

## 0.7.1 (2017-05-04)

Bug fixes

  - Fixed bug where peptides with different mod states were merged together.

## 0.7.0 (2017-05-04)

Features

  - Scroll scan selection list when using keyboard navigation or search.

## 0.6.0 (2017-05-02)

Features

  - Added the ability to import validation data from CAMV-Matlab sessions.

## 0.5.2 (2017-04-11)

Features

  - More performance improvements.

## 0.5.1 (2017-04-11)

Bug fixes

  - Fixed bugs in updating precursor + quantification peaks.

## 0.5.0 (2017-04-11)

Features

  - Greatly improved performance of interface on large data sets.

Bug fixes

  - Fixed residual bugs in selecting / expanding nodes in scan selection list.

## 0.4.0 (2017-04-08)

Features

  - Somewhat improved performance of TreeView, using rc-tree package.
  - Allow calling pycamverter from CAMV as an alternative to opening a database.

## 0.3.3 (2017-04-06)

Features

  - Added the ability to add custom labels to peaks and remove a label.

## 0.3.2 (2017-04-05)

Features

  - Added support for reprocessing individual scans without PTM combination
    limits.

## 0.3.1 (2017-03-27)

Features

  - Allow picking precursor + quantification ions to view ppm / expected m/z /
    etc.

## 0.3.0 (2017-03-24)

Features

  - Major change to storage format, now CAMV uses an SQLite database and
    fetches / updates data on the fly. +These changes are not backwards
    compatible with old CAMV / pycamverter data+.

Bug fixes

  - Fixed bug on selecting peaks with no matches.

## 0.2.0 (2017-03-17)

Features
  - Added search functionality
  - Use A4 ratio for export images
  - Track version of CAMV / pycamverter used to generate files.
  - Added modal view for determining which b/y ions were identified in a peptide.

## 0.1.6 (2017-03-13)

Features

  - Added a icon to CAMV packaged executable

Bug fixes

  - Include electron-compile to fix windows error

## 0.1.5 (2017-03-10)

Features

  - Color isotope peaks yellow as in CAMV-matlab
  - Label peaks with magenta star when ppm > CID / HCD_TOL

## 0.1.4 (2017-03-06)

Fixed several CI bugs, should deploy on Windows, Linux, and OS X now.

## 0.1.2 (2017-03-06)

Several changes to the building pipeline. Relies only on electron-forge /
electron-prebuilt-compile now.

## 0.1.1 (2017-03-06)

Fixed several bugs based on testing with real data sets

Features

  - Added k/j navigation, alongside up/down
  - Added spectra zoom support
  - Use greener greens for matching ions
  - Reduced label clutter on spectra
  - Show observed vs. expected m/z values

Bug fixes

  - Corrected modified cysteine mass
  - Fixed bug with loading large files
  - Only label best matching precursor / quant ions

## 0.1.0 (2017-03-02)

Initial release
