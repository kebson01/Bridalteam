@extends('layouts.main')

@section('head')
<script>
    var vendordata = <?php print json_encode($vendor); ?>;                  
    var primarycategory = <?php print json_encode($primarycategory); ?>;                  
    var secondarycategory = <?php print json_encode($secondarycategory); ?>;                  
    var primaryquestions = <?php print json_encode($primaryquestions); ?>;                  
    var secondaryquestions = <?php print json_encode($secondaryquestions); ?>;                  
</script>
@endsection

@section('page')
<div id="page">
    <div id="vendorregister" class="page">
        <header class="pageheader">
            <h1>Register as a Vendor</h1>
            <span class="overlay"></span>
        </header>
        <div id="pagebody">
            <div class="innerwrapper">                
                <span id="firstrunapp"></span>
            </div>
        </div>
    </div>
</div>
@endsection