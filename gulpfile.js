'use strict';
/* eslint no-unused-vars: 0 */
const gulp = require('gulp'),
    clean = require('gulp-clean'),
    sass = require('gulp-sass'),
    sassdoc = require('sassdoc'),
    sourcemaps = require('gulp-sourcemaps'),
    autoprefixer = require('gulp-autoprefixer'),
    imagemin = require('gulp-imagemin'),
    uglify = require('gulp-uglify'),
    babel = require('gulp-babel'),
    runSequence = require('run-sequence'),
    browserSync = require('browser-sync').create(),
    plumber = require('gulp-plumber'),
    notify = require('gulp-notify'),
    merge = require('gulp-merge'),
    log = require('fancy-log'),
    browserify = require('browserify'),
    babelify = require('babelify'),
    source = require('vinyl-source-stream'),
    buffer = require('vinyl-buffer'),
    rename = require('gulp-rename'),
    spritesmith = require('gulp.spritesmith');

var reportError = function (error) {
    notify({
        title: 'Gulp Task Error',
        message: 'Check the console.'
    }).write(error);

    console.log(error.toString());
    this.emit('end');
};

// TO DO 
// ADD SUPERFISH []
// REFACTOR PATHS INTO TASK LIST (you can glob multiple inputs for 1 output)

var rootFolder = {
    appDir : 'app/',
    distDir : 'dist/' 
};

var nodePaths = {
    JS: {
        jQuery : 'node_modules/jquery/dist/jquery.min.js',
        bootstrap : 'node_modules/bootstrap/dist/js/bootstrap.bundle.min.js',
        ekkoLightbox : 'node_modules/ekko-lightbox/dist/ekko-lightbox.min.js',
        superFish : 'node_modules/superfish/dist/js/superfish.min.js',
        hoverIntent : 'node_modules/superfish/dist/js/hoverIntent.js',
    },
    SCSS: {
        bootstrap : 'node_modules/bootstrap/scss/**/*.*',
    },
    CSS: {
        ekkoLightbox : 'node_modules/ekko-lightbox/dist/ekko-lightbox.css',
    }
};

var gulpPath = {
    appDir: 'app/',
    distDir: 'dist/',
    spriteData: {
        get input() {
            return gulpPath.appDir + 'img/sprite/*.png';
        },
        imgName: 'sprite.png',
        cssName: '_sprite.scss',
        imgPath: './../img/sprite.png',
        get cssTemplate() {
            return gulpPath.appDir + 'scss-templates/scss.template.handlebars';
        },
        get outputImg() {
            return gulpPath.appDir + 'img/';
        },
        get outputScss() {
            return gulpPath.appDir + 'scss/_website/base/';
        }
    },
    jsLib: {
        get input() {
            return gulpPath.appDir + 'js/lib/*.*';
        },
        get output() {
            return gulpPath.distDir + 'js/lib/';
        }, 
        get watch() {
            return gulpPath.appDir + 'js/lib/*.*';
        }
    },
    JS: {
        get input() {
            return gulpPath.appDir + 'js/app.js';
        },
        get output() {
            return gulpPath.distDir + 'js/';
        },
        get watch() {
            return [
                gulpPath.appDir + 'js/**/*.js',
                '!' + gulpPath.appDir + 'js/lib/**/*.*',
                '!' + gulpPath.appDir + 'js/lib/' 
            ];
        }
    },
    images: {
        get input() {
            return gulpPath.appDir + 'img/**/*.*';
        },
        get noSprite() {
            return '!' + gulpPath.appDir + 'img/sprite/';
        },
        get output() {
            return gulpPath.distDir + 'img/';
        },
        get watch() {
            return [
                gulpPath.images.input,
                gulpPath.images.noSprite,
                gulpPath.images.noSprite + '**/*'
            ];
        }
    },
    html: {
        get input() {
            return gulpPath.appDir + '**/*.html';
        },
        get output() {
            return gulpPath.distDir;
        },
        get watch() {
            return gulpPath.appDir + '**/*.html';
        }
    },
    scss: {
        get input() {
            return gulpPath.appDir + 'scss/app.scss';
        },
        get output() {
            return gulpPath.distDir + 'css/';
        },
        get watch() {
            return gulpPath.appDir + 'scss/**/*.scss';
        }
    }
};

gulp.task('clean', function () {
    return gulp.src(gulpPath.distDir + '*', {
        read: false
    })
        .pipe(clean());
});


gulp.task('sprite', function () {
    var spriteData = gulp.src(gulpPath.spriteData.input).pipe(spritesmith({
        imgName: gulpPath.spriteData.imgName,
        cssName: gulpPath.spriteData.cssName,
        imgPath: gulpPath.spriteData.imgPath,
        padding: 20,
        // retinaSrcFilter: ['app/img/sprite/*@2x.png'],
        // retinaImgName: 'sprite@2x.png',
        // retinaImgPath: './img/sprite@2x.png',
        cssTemplate: gulpPath.spriteData.cssTemplate,
    }));
    log(gulpPath.spriteData.input);
    
    spriteData.img.pipe(gulp.dest(gulpPath.spriteData.outputImg));
    spriteData.css.pipe(gulp.dest(gulpPath.spriteData.outputScss));

});
// Copy Data 
gulp.task('copyNodeJS', function(){
    return gulp.src([
        nodePaths.JS.jQuery,
        nodePaths.JS.bootstrap,
        nodePaths.JS.ekkoLightbox,
        nodePaths.JS.superFish,
        nodePaths.JS.hoverIntent
    ]).pipe(gulp.dest(rootFolder.appDir + 'js/lib/'));
});

gulp.task('copyNodeSCSS', function(){
    return gulp.src([
        nodePaths.CSS.ekkoLightbox
    ]).pipe(rename({
        extname: '.scss'
    })).pipe(gulp.dest(rootFolder.appDir + 'scss/_website/vendors/'));
});

gulp.task('copyBoostrapSCSS', function () {
    return gulp.src([
        nodePaths.SCSS.bootstrap,
    ]).pipe(gulp.dest(rootFolder.appDir + 'scss/_bootstrap/'));
});

gulp.task('copyLib', function () {
    return gulp.src(gulpPath.jsLib.input)
        .pipe(gulp.dest(gulpPath.jsLib.output))
        .pipe(browserSync.stream());
});

gulp.task('copyHtml', function () {
    return gulp.src(gulpPath.html.input)
        .pipe(gulp.dest(gulpPath.html.output))
        .pipe(browserSync.stream());
});

// Browserify 
var b = browserify(gulpPath.JS.input, {
    cache: {},
    packageCache: {},
    fullPaths: false
});

gulp.task('bundleJS', bundle);
b.on('update', bundle);
b.transform(['babelify', {
    presets: ['@babel/preset-env'],
    babel: require('@babel/core')
}]);

function bundle() {
    return b.bundle()
        .on('error', reportError)
        .pipe(source('app.js'))
        .pipe(buffer())
        .pipe(sourcemaps.init())
        .pipe(uglify({
            compress: {
                sequences: false
            }
        }))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(gulpPath.JS.output))
        .pipe(browserSync.stream());
}

// SCSS => CSS 
gulp.task('scss', function () {
    return gulp.src(gulpPath.scss.input)
        .pipe(sourcemaps.init())
        .pipe(sassdoc())
        .pipe(sass({
            outputStyle: 'compressed'
        }).on('error', sass.logError))
        .pipe(autoprefixer({
            browsers: ['last 2 versions']
        }))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(gulpPath.scss.output))
        .pipe(browserSync.stream());
});

// Images
gulp.task('images', function () {
    return gulp.src([
        gulpPath.images.input,
        gulpPath.images.noSprite,
        gulpPath.images.noSprite + '**/*'
    ])
        .pipe(imagemin())
        .pipe(gulp.dest(gulpPath.images.output));
});

gulp.task('browserSync', function () {
    browserSync.init({
        server: {
            baseDir: 'dist'
        }
    });
});


/**
 * Run Tasks 1st run build then watch
 */
gulp.task('build', function () {
    runSequence('clean', 'copyNodeJS', 'copyNodeSCSS', 'copyBoostrapSCSS', 'copyLib', 'bundleJS', 'copyHtml', 'sprite', 'images', 'scss');
});

/** 
 * Gulp Sprite Combo
 */
gulp.task('spriteImgCombo', function(){
    runSequence('sprite', 'images');
});

gulp.task('watch', ['browserSync', 'scss', 'bundleJS', 'spriteImgCombo'], function () {
    gulp.watch(gulpPath.spriteData.input, ['sprite']);
    gulp.watch(gulpPath.images.watch, ['images']);
    gulp.watch(gulpPath.scss.watch, ['scss']);
    gulp.watch(gulpPath.jsLib.watch, ['copyLib']);
    gulp.watch(gulpPath.JS.watch, ['bundleJS']);
    gulp.watch(gulpPath.html.watch, ['copyHtml']);
});

