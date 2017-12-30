@extends('layouts.main')

@section('title')
<title>My Account - {{ env('SEO_SITETITLE') }}</title>
@endsection

@section('head')
<script>
    var vendordata = <?php print json_encode($vendor); ?>;    
    var primaryquestions = <?php print json_encode($primaryquestions); ?>;    
    var secondaryquestions = <?php print json_encode($secondaryquestions); ?>;    
    var nextsub = <?php print json_encode($nextsub); ?>;    
    var currentsub = <?php print json_encode($currentsub); ?>;    
</script>
@endsection


@section('page')
<div id="page">
    <div id="vendoraccount" class="page">
        <span id="accountapp"></span> 
    </div>
</div>
@endsection