const { src, dest, parallel, watch, series } = require('gulp'),
  sass = require('gulp-sass'),
  cssmin = require('gulp-clean-css'),
  concat = require('gulp-concat'),
  uglify = require('gulp-uglify'),
  browserSync = require('browser-sync'),
  reload = browserSync.reload,
  size = require('gulp-size'),
  imagemin = require('gulp-imagemin'),
  imageminOptipng = require('imagemin-optipng'),
  imageminSvgo = require('imagemin-svgo'),
  imageminMozjpeg = require('imagemin-mozjpeg'),
  plumber = require('gulp-plumber'),
  notify = require('gulp-notify'),
  pug = require('gulp-pug'),
  iconfont = require('gulp-iconfont'),
  iconfontCss = require('gulp-iconfont-css'),
  spritesmith = require('gulp.spritesmith'),
  buffer = require('vinyl-buffer'),
  merge = require('merge-stream'),
  purgecss = require("gulp-purgecss"),
  replace = require('gulp-replace');

// npm install gulp gulp-sass gulp-clean-css gulp-concat gulp-uglify browser-sync gulp-size gulp-imagemin imagemin-optipng imagemin-svgo imagemin-mozjpeg gulp-plumber gulp-notify gulp-pug gulp-iconfont gulp-iconfont-css gulp.spritesmith vinyl-buffer merge-stream gulp-purgecss gulp-replace --save-dev



// pug dosylarını html çevirir
function pughtml() {
  return src(['src/views/**/*.pug', 'src/views-amp/**/*.pug'])
    .pipe(pug({
      pretty: true
    }))
    .pipe(dest('dist/'))
    .pipe(browserSync.reload({
      stream: true
    }))
}
// sprite oluşturur
function sprite() {
  var spriteData = src('src/img/sprite/*.png')
    .pipe(spritesmith({
      imgName: 'sprite.png',
      cssName: 'sprite.css',
      imgPath: '/assets/img/sprite.png?v=' + Date.now().toString().substring(9),
      retinaImgPath: '/assets/img/sprite@2x.png?v=' + Date.now().toString().substring(9),
      retinaSrcFilter: 'src/img/sprite/*@2x.png',
      retinaImgName: 'sprite@2x.png',
      padding: 5
    }));
  var imgStream = spriteData.img
    .pipe(buffer())
    .pipe(imagemin([imagemin.optipng({optimizationLevel: 5})]))
    .pipe(dest('dist/assets/img'));
  var cssStream = spriteData.css
    .pipe(dest('src/scss/gulp/'))
  return merge(imgStream, cssStream);
}
// font dosyası oluşturur
function icon() {
  return src('src/icon/*.svg')
    .pipe(iconfontCss({
      fontName: 'icon',
      // template path
      path: 'src/scss/gulp/_icon-template.scss',
      // will generate scss
      targetPath: 'src/scss/gulp/_icon.scss',
      // template font path
      fontPath: '/assets/font/'
    }))
    .pipe(iconfont({
      fontName: 'icon',
      formats: ['ttf', 'eot', 'woff', 'woff2'],
      normalize: true,
      fontHeight: 2000
    }))
    // will generate font
    .pipe(dest('dist/assets/font/'));
}
// sass css çevirir
function scss() {
  var onError = function (err) {
    notify.onError({
      title: "Gulp",
      subtitle: "Failure!",
      message: "Error: <%= error.message %>",
      sound: "Beep"
    })(err);
    this.emit('end');
  };

  return src(['src/scss/**/*.scss','!src/scss/amp.scss'])
    .pipe(plumber({
      errorHandler: onError
    }))
    .pipe(sass())
    .pipe(purgecss({
      content: ['dist/html/*.html']
    }))
    .pipe(cssmin())
    .pipe(size({
      gzip: true,
      showFiles: true
    }))
    .pipe(dest('dist/assets/css/'))
    .pipe(browserSync.reload({
      stream: true
    }))
}
// amp sass css çevirir
function scssAmp() {
  var onError = function (err) {
    notify.onError({
      title: "Gulp",
      subtitle: "Failure!",
      message: "Error: <%= error.message %>",
      sound: "Beep",
    })(err);
    this.emit("end");
  };

  return (
    src("src/scss/amp.scss")
      .pipe(
        plumber({
          errorHandler: onError,
        })
      )
      .pipe(sass())
      .pipe(purgecss({
        content: ['dist/amphtml/amp.html']
      }))
      .pipe(cssmin())
      .pipe(replace(/@charset "UTF-8";/g, ""))
      // .pipe(replace(/..\/img\//g, "/assets/img/"))
      .pipe(replace(/!important/g, ""))
      .pipe(
        size({
          gzip: true,
          showFiles: true,
        })
      )
      .pipe(dest("dist/assets/css/"))
      .pipe(
        browserSync.reload({
          stream: true,
        })
      )
  );
}
// browser refresh eder
function browser() {
  browserSync({
    server: {
      baseDir: "./dist"
    }
  });
}
// js min ve birleştirme
function js() {
  return src(['src/js/plugin.js', 'src/js/scripts.js'])
    .pipe(concat('scripts-min.js'))
    .pipe(uglify())
    .pipe(size({
      gzip: true,
      showFiles: true
    }))
    .pipe(dest('dist/assets/js/min'))
    .pipe(reload({
      stream: true
    }));
}
// jsleri tek tek kullanım için minify etme
function singlejs() {
  return src('src/js/single/*.js')
    .pipe(uglify())
    .pipe(size({
      gzip: true,
      showFiles: true
    }))
    .pipe(dest('dist/assets/js/min'))
}
// plugin js min ve birleştirme
function pluginjs() {
  return src('src/js/plugin/*.js')
    .pipe(concat('plugin.js'))
    .pipe(dest('src/js'))
}
// src font dosyalarını dist taşır
function font() {
  return src('src/font/*')
    .pipe(dest('dist/assets/font/'))
}
// resimleri min etme
function imgmin() {
  return src(['src/img/*'])
    .pipe(buffer())
    .pipe(imagemin(
      [
        imageminMozjpeg({
          quality: 90
        }),
        imageminOptipng(),
        imageminSvgo({
          plugins: [{
            removeViewBox: false
          }]
        })
      ]))
    .pipe(dest('dist/assets/img'))
    .pipe(reload({
      stream: true
    }));
}
// değişiklikleri izleme
function live() {
  watch('src/scss/**/*', series(scss));
  watch('src/scss/**/*', series(scssAmp));
  watch('src/js/*.js', series(js));
  watch('src/js/single/*.js', series(singlejs));
  watch('src/js/plugin/*.js', series(pluginjs));
  watch('src/views/**/*.pug', series(pughtml));
  watch('src/views-amp/**/*.pug', series(pughtml));
  watch('src/icon/*.svg', series(icon));
  watch('src/img/sprite/*.png', series(sprite));
  watch('src/img/*', series(imgmin));
  watch('src/font/*', series(font));
}

exports.pughtml = pughtml;
exports.sprite = sprite;
exports.icon = icon;
exports.scss = scss;
exports.scssAmp = scssAmp;
exports.browser = browser;
exports.js = js;
exports.singlejs = singlejs;
exports.pluginjs = pluginjs;
exports.font = font;
exports.imgmin = imgmin;
exports.live = live;
exports.default = parallel(browser, live);