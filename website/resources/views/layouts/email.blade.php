<!DOCTYPE html>
<html lang="en-US">
	<head>
		<meta charset="utf-8">
	</head>
	<body style="background-color:#FAFAFA">
        <br/>
		<div style="margin:auto;width:600px;background-color:#fff;">
            <br/>
            <h1 style="text-align:center;margin-top:20px;"><img src="{{ $data['webdomain'] }}/img/email/email-logo.png" alt="Bridal Team Wedding Planning" /></h1>
            @yield('content')
            <br/>
            <br/>
        </div>
        <br/>
        <div style="margin:auto; width:490px; font-size:12px; color:#9C9C9D; font-family:helvetica, sans-serif;">
			<span style="text-align:left;">&copy; <?php print date("Y"); ?> Bridal Team</span>
		</div>
        <br/>
	</body>
</html>