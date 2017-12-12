var gulp = require('gulp');
var sass = require('gulp-sass');
var babel = require('gulp-babel');
var concat = require('gulp-concat');
var sourcemaps = require('gulp-sourcemaps');
var autoprefixer = require("gulp-autoprefixer");
var browsersync = require('browser-sync').create();

gulp.task('default', function(){

});

gulp.task('sass', function(){
    return gulp.src("./assets/sass/app.scss")
        .pipe(sourcemaps.init())
        .pipe(sass({outputStyle: "compressed"}).on('error', sass.logError))
        .pipe(autoprefixer({
            browsers: ['last 2 versions', 'ie <= 9'],
            cascade: false
        }))
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest('../public/css'))
        .pipe(browsersync.stream());
});

gulp.task('js', function(){
    return gulp.src([        
        "./assets/js/selectize.es6",
        "./assets/js/imagesloaded.pkgd.min.es6",
        "./assets/js/isotope.pkgd.min.es6",
        "./assets/js/fit-columns.es6",
        "./assets/js/jquery.minimalect.min.es6",
        "./assets/js/js.cookie.es6",
        "./assets/js/jquery.payment.min.es6",
        "./assets/js/app.es6"
    ])
    .pipe(babel().on('error',console.log))
    .pipe(concat('all.js'))
    .pipe(gulp.dest('../public/js'))
});

gulp.task('start', function(){
    browsersync.init({
        proxy: 'http://bridalteam.localhost/'
    });

    gulp.watch(['./assets/sass/**/*.scss'], ['sass']);
    gulp.watch(['./assets/js/**/*.es6'], ['js']);
    gulp.watch(['/views/**/*.blade.php'], function(){
        browsersync.reload();
    });
});