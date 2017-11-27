@extends('layouts.main')

@section('head')
    <script>
        var questions = <?php print json_encode($questions); ?>;
        var vendors = <?php print json_encode($vendors); ?>;
    </script>
@endsection


@section('page')
<div id="page">
    <div id="vendors" class="page">
        <header class="pageheader">
            <h1>Vendors <span><?php print $category->name; ?></span></h1>
            <span class="overlay"></span>
        </header>
        <div id="pagebody">
            <div class="innerwrapper">
                <div id="categoryapp"></div>
            </div>
        </div>
    </div>
</div>
@endsection