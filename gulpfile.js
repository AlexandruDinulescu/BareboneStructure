const gulp = require("gulp"),
    sass = require("gulp-sass"),
    sourcemaps = require("gulp-sourcemaps"),
    autoprefixer = require("gulp-autoprefixer"),
    imagemin = require("gulp-imagemin"),
    useref = require("gulp-useref"),
    gulpif = require("gulp-if"),
    uglify = require("gulp-uglify"),
    babel = require("gulp-babel"),
    uncss = require("gulp-uncss"),
    browserSync = require("browser-sync").create();

gulp.task("css", function () {
    return gulp.src("app/scss/**/*.scss")
        .pipe(sourcemaps.init())
        .pipe(sass({ outputStyle: "compressed" }).on("error", sass.logError))
        .pipe(autoprefixer({
            browsers: ["last 2 versions"]
        }))
        .pipe(sourcemaps.write("./maps"))
        .pipe(gulp.dest("dist/css"))
        .pipe(browserSync.stream());
});

gulp.task("uncss", function () {
    return gulp.src("app/scss/**/*.scss")
        .pipe(sourcemaps.init())
        .pipe(sass({ outputStyle: "compressed" }).on("error", sass.logError))
        .pipe(uncss({
            html: ["dist/**/*.html"]
        }))
        .pipe(autoprefixer({
            browsers: ["last 2 versions"]
        }))
        .pipe(sourcemaps.write("./maps"))
        .pipe(gulp.dest("dist/css"))
        .pipe(browserSync.stream());
});

gulp.task("copy", function () {
    return gulp.src("app/**/*.html")
        .pipe(useref())
        .pipe(gulpif("*.js", sourcemaps.init()))
        .pipe(gulpif("*.js", babel({ presets: ["env"] })))
        .pipe(gulpif("*.js", uglify()))
        .pipe(gulpif("*.js", sourcemaps.write("./maps")))
        .pipe(gulp.dest("dist"))
        .pipe(browserSync.stream());
});

gulp.task("images", function () {
    return gulp.src("app/img/*")
        .pipe(imagemin())
        .pipe(gulp.dest("dist/img"));
});

gulp.task("browserSync", function () {
    browserSync.init({
        server: {
            baseDir: "dist"
        }
    });
});

gulp.task("watch", ["browserSync", "css"], function () {
    gulp.watch("app/img/**/*.*", ["images"]);
    gulp.watch("app/scss/**/*.scss", ["css"]);
    gulp.watch("app/**/*.+(html|js)", ["copy"]);
});
