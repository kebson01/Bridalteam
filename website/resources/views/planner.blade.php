@extends('layouts.main')

@section('title')
<title>AI Wedding Planner &middot; Meet Bee - {{ env('SEO_SITETITLE') }}</title>
@endsection

@section('head')
<style>
    /* ---------- AI Wedding Planner ("Bee") ---------- */
    #plannerpage { background:#ffffff; }

    #plannerpage .planner-hero{
        position:relative;
        text-align:center;
        padding:70px 20px 60px;
        color:#fff;
        background:radial-gradient(1200px 400px at 85% 0%, rgba(224,169,109,.35), transparent 60%),
                   radial-gradient(900px 400px at 10% 10%, rgba(224,169,109,.18), transparent 55%),
                   #211d19;
        overflow:hidden;
    }
    #plannerpage .planner-hero .eyebrow{
        margin:0 0 10px;
        letter-spacing:.28em;
        text-transform:uppercase;
        font-size:13px;
        font-weight:700;
        color:#e0a96d;
    }
    #plannerpage .planner-hero h1{
        margin:0 0 18px;
        font-size:52px;
        line-height:1.05;
        font-weight:300;
        letter-spacing:.04em;
        color:#fff;
    }
    #plannerpage .planner-hero p.sub{
        max-width:640px;
        margin:0 auto;
        font-size:18px;
        line-height:1.5;
        color:#d9d2cb;
    }

    #plannerpage .planner-wrap{
        max-width:820px;
        margin:0 auto;
        padding:34px 20px 80px;
    }

    /* starter chips */
    #plannerpage .chips{
        display:flex;
        flex-wrap:wrap;
        gap:12px;
        justify-content:center;
        margin-bottom:26px;
    }
    #plannerpage .chip{
        border:1px solid #eadfd3;
        background:#fff;
        color:#6b5f54;
        padding:11px 18px;
        border-radius:999px;
        font-size:15px;
        cursor:pointer;
        transition:all .15s ease;
        line-height:1.2;
    }
    #plannerpage .chip:hover{
        border-color:#e0a96d;
        color:#a9723a;
        box-shadow:0 4px 14px rgba(224,169,109,.22);
    }

    /* chat card */
    #plannerpage .chatcard{
        border:1px solid #eee4d8;
        border-radius:18px;
        box-shadow:0 18px 45px rgba(60,45,30,.10);
        overflow:hidden;
        background:#fff;
    }
    #plannerpage .chathead{
        display:flex;
        align-items:center;
        gap:10px;
        padding:14px 18px;
        border-bottom:1px solid #f1e8dd;
    }
    #plannerpage .chathead .dots{ display:flex; gap:6px; }
    #plannerpage .chathead .dots i{ width:11px; height:11px; border-radius:50%; display:inline-block; }
    #plannerpage .chathead .dots i:nth-child(1){ background:#f0a63c; }
    #plannerpage .chathead .dots i:nth-child(2){ background:#f0a63c; }
    #plannerpage .chathead .dots i:nth-child(3){ background:#d9d2ca; }
    #plannerpage .chathead .who{ font-size:14px; font-weight:700; color:#6b5f54; }

    #plannerpage .messages{
        min-height:360px;
        max-height:520px;
        overflow-y:auto;
        padding:22px;
        background:#f4f0eb;
        display:flex;
        flex-direction:column;
        gap:14px;
    }

    #plannerpage .msg{ display:flex; gap:12px; align-items:flex-end; max-width:88%; }
    #plannerpage .msg.user{ align-self:flex-end; flex-direction:row-reverse; }

    #plannerpage .avatar{
        flex:0 0 auto;
        width:40px; height:40px;
        border-radius:50%;
        overflow:hidden;
        background:radial-gradient(circle at 50% 35%, #ffe6a8, #f0b64c);
        display:flex; align-items:center; justify-content:center;
        box-shadow:0 2px 6px rgba(0,0,0,.10);
    }
    #plannerpage .avatar img{ width:100%; height:100%; object-fit:cover; }
    #plannerpage .avatar.noimg::before{ content:"\01F41D"; font-size:22px; line-height:1; }
    #plannerpage .msg.user .avatar{ background:#e0a96d; }
    #plannerpage .msg.user .avatar.noimg::before{ content:"\01F490"; }

    #plannerpage .bubble{
        background:#fff;
        border:1px solid #ece2d6;
        padding:13px 16px;
        border-radius:14px;
        font-size:15.5px;
        line-height:1.55;
        color:#4a4038;
        box-shadow:0 1px 2px rgba(0,0,0,.03);
    }
    #plannerpage .msg.user .bubble{
        background:#e0a96d;
        border-color:#e0a96d;
        color:#fff;
    }
    #plannerpage .bubble strong{ color:#a9723a; }
    #plannerpage .msg.user .bubble strong{ color:#fff; }
    #plannerpage .bubble ul{ margin:8px 0 2px; padding-left:20px; }
    #plannerpage .bubble li{ margin:3px 0; }
    #plannerpage .bubble .lead{ display:block; margin-bottom:4px; }

    /* typing indicator */
    #plannerpage .typing span{
        display:inline-block; width:7px; height:7px; margin:0 2px;
        background:#c9baa9; border-radius:50%; opacity:.5;
        animation:beeblink 1s infinite;
    }
    #plannerpage .typing span:nth-child(2){ animation-delay:.15s; }
    #plannerpage .typing span:nth-child(3){ animation-delay:.3s; }
    @keyframes beeblink{ 0%,60%,100%{ transform:translateY(0); opacity:.4; } 30%{ transform:translateY(-4px); opacity:.9; } }

    /* composer */
    #plannerpage .composer{
        display:flex;
        gap:12px;
        padding:16px;
        border-top:1px solid #f1e8dd;
        background:#fff;
    }
    #plannerpage .composer input{
        flex:1;
        border:1px solid #e6dccf;
        border-radius:999px;
        padding:14px 20px;
        font-size:15.5px;
        outline:none;
        color:#4a4038;
    }
    #plannerpage .composer input:focus{ border-color:#e0a96d; box-shadow:0 0 0 3px rgba(224,169,109,.18); }
    #plannerpage .composer button{
        border:none;
        border-radius:999px;
        padding:0 30px;
        font-size:15px;
        font-weight:700;
        color:#fff;
        cursor:pointer;
        background:linear-gradient(180deg,#f2b976,#e79a4f);
        transition:filter .15s ease;
    }
    #plannerpage .composer button:hover{ filter:brightness(1.05); }
    #plannerpage .composer button:disabled{ opacity:.55; cursor:default; }

    /* lead capture */
    #plannerpage .lead-capture{
        margin-top:26px;
        border:1px solid #eee4d8;
        border-radius:18px;
        background:linear-gradient(180deg,#fffaf3,#fff);
        box-shadow:0 10px 30px rgba(60,45,30,.06);
        padding:26px 24px;
    }
    #plannerpage .lead-capture h2{
        margin:0 0 6px;
        font-size:22px;
        font-weight:400;
        color:#4a4038;
        letter-spacing:.02em;
    }
    #plannerpage .lead-capture p.blurb{
        margin:0 0 18px;
        font-size:15px;
        color:#8a7d70;
        line-height:1.5;
    }
    #plannerpage .lead-fields{
        display:flex;
        flex-wrap:wrap;
        gap:12px;
    }
    #plannerpage .lead-fields .field{ flex:1 1 200px; }
    #plannerpage .lead-fields .field.full{ flex:1 1 100%; }
    #plannerpage .lead-capture label{
        display:block;
        font-size:13px;
        font-weight:700;
        color:#6b5f54;
        margin-bottom:6px;
    }
    #plannerpage .lead-capture input,
    #plannerpage .lead-capture textarea{
        width:100%;
        border:1px solid #e6dccf;
        border-radius:12px;
        padding:12px 15px;
        font-size:15px;
        color:#4a4038;
        outline:none;
        font-family:inherit;
    }
    #plannerpage .lead-capture textarea{ resize:vertical; min-height:66px; }
    #plannerpage .lead-capture input:focus,
    #plannerpage .lead-capture textarea:focus{
        border-color:#e0a96d; box-shadow:0 0 0 3px rgba(224,169,109,.18);
    }
    /* honeypot: hidden from humans */
    #plannerpage .lead-hp{ position:absolute; left:-9999px; width:1px; height:1px; overflow:hidden; }
    #plannerpage .lead-actions{
        display:flex; align-items:center; gap:16px; margin-top:16px; flex-wrap:wrap;
    }
    #plannerpage .lead-actions button{
        border:none;
        border-radius:999px;
        padding:13px 34px;
        font-size:15px;
        font-weight:700;
        color:#fff;
        cursor:pointer;
        background:linear-gradient(180deg,#f2b976,#e79a4f);
        transition:filter .15s ease;
    }
    #plannerpage .lead-actions button:hover{ filter:brightness(1.05); }
    #plannerpage .lead-actions button:disabled{ opacity:.55; cursor:default; }
    #plannerpage .lead-status{ font-size:14.5px; line-height:1.4; }
    #plannerpage .lead-status.ok{ color:#3f8a52; }
    #plannerpage .lead-status.err{ color:#c0563c; }
    #plannerpage .lead-capture.done .lead-fields,
    #plannerpage .lead-capture.done .lead-actions button{ display:none; }

    @media (max-width:640px){
        #plannerpage .planner-hero h1{ font-size:36px; }
        #plannerpage .planner-hero p.sub{ font-size:16px; }
        #plannerpage .messages{ min-height:300px; }
        #plannerpage .msg{ max-width:96%; }
    }
</style>
@endsection

@section('page')
<div id="plannerpage">
    <section class="planner-hero">
        <p class="eyebrow">Your AI Planning Team</p>
        <h1>AI Wedding Planner</h1>
        <p class="sub">Ask anything about your big day and get real, tailored guidance in seconds &mdash; timelines, budgets, checklists and vendor picks.</p>
    </section>

    <div class="planner-wrap">
        <div class="chips" id="beeChips">
            <button class="chip" type="button">Build me a 12-month planning timeline</button>
            <button class="chip" type="button">Estimate a budget for 150 guests in Miami</button>
            <button class="chip" type="button">What should I book first?</button>
            <button class="chip" type="button">Ideas for a modern minimalist wedding</button>
            <button class="chip" type="button">Help me write a day-of schedule</button>
        </div>

        <div class="chatcard">
            <div class="chathead">
                <span class="dots"><i></i><i></i><i></i></span>
                <span class="who">Bridal Team &middot; Bee, your AI Planner</span>
            </div>

            <div class="messages" id="beeMessages" aria-live="polite">
                <!-- messages injected by JS -->
            </div>

            <form class="composer" id="beeForm" autocomplete="off">
                <input type="text" id="beeInput" placeholder="Ask Bee about your wedding&hellip;" aria-label="Ask Bee about your wedding" />
                <button type="submit" id="beeSend">Send</button>
            </form>
        </div>

        <div class="lead-capture" id="leadCapture">
            <h2>Want a human on your team?</h2>
            <p class="blurb">Leave your name and email and the Bridal Team will reach out with tailored recommendations for your big day.</p>
            <form id="leadForm" autocomplete="on">
                <div class="lead-fields">
                    <div class="field">
                        <label for="leadName">Your name</label>
                        <input type="text" id="leadName" name="name" placeholder="Alex &amp; Jordan" required />
                    </div>
                    <div class="field">
                        <label for="leadEmail">Email</label>
                        <input type="email" id="leadEmail" name="email" placeholder="you@example.com" required />
                    </div>
                    <div class="field full">
                        <label for="leadMessage">Anything you'd like us to know? <span style="font-weight:400;color:#a99e90;">(optional)</span></label>
                        <textarea id="leadMessage" name="message" placeholder="Date, city, guest count, vibe&hellip;"></textarea>
                    </div>
                </div>
                <div class="lead-hp" aria-hidden="true">
                    <label>Company<input type="text" name="company" tabindex="-1" autocomplete="off" /></label>
                </div>
                <div class="lead-actions">
                    <button type="submit" id="leadSubmit">Send my details</button>
                    <span class="lead-status" id="leadStatus" role="status" aria-live="polite"></span>
                </div>
            </form>
        </div>
    </div>
</div>

@verbatim
<script>
(function () {
    var messagesEl = document.getElementById('beeMessages');
    var form = document.getElementById('beeForm');
    var input = document.getElementById('beeInput');
    var chips = document.getElementById('beeChips');

    // Path to Bee's mascot. Drop the bee artwork at website/public/img/bee-planner.png
    // and it will appear automatically; until then a friendly bee emoji stands in.
    var BEE_IMG = '/img/bee-planner.png';

    function avatar(kind) {
        var wrap = document.createElement('div');
        wrap.className = 'avatar';
        if (kind === 'bee') {
            var img = document.createElement('img');
            img.src = BEE_IMG;
            img.alt = 'Bee, your wedding planning assistant';
            img.onerror = function () { wrap.removeChild(img); wrap.classList.add('noimg'); };
            wrap.appendChild(img);
        } else {
            wrap.classList.add('noimg');
        }
        return wrap;
    }

    function scrollDown() { messagesEl.scrollTop = messagesEl.scrollHeight; }

    function addMessage(kind, html) {
        var row = document.createElement('div');
        row.className = 'msg ' + (kind === 'user' ? 'user' : 'bee');
        var bubble = document.createElement('div');
        bubble.className = 'bubble';
        bubble.innerHTML = html;
        row.appendChild(avatar(kind === 'user' ? 'user' : 'bee'));
        row.appendChild(bubble);
        messagesEl.appendChild(row);
        scrollDown();
        return row;
    }

    function showTyping() {
        var row = document.createElement('div');
        row.className = 'msg bee';
        row.setAttribute('data-typing', '1');
        var bubble = document.createElement('div');
        bubble.className = 'bubble typing';
        bubble.innerHTML = '<span></span><span></span><span></span>';
        row.appendChild(avatar('bee'));
        row.appendChild(bubble);
        messagesEl.appendChild(row);
        scrollDown();
        return row;
    }

    function esc(s) {
        return String(s).replace(/[&<>]/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c];
        });
    }

    // ---- Bee's knowledge (scripted, front-end only) ----
    function beeReply(text) {
        var t = text.toLowerCase();

        if (/(time\s?line|12[-\s]?month|planning schedule|when.*(book|start|plan))/.test(t)) {
            return '<span class="lead">Love it &mdash; here\'s a <strong>12-month timeline</strong> to keep you calm and on track:</span>'
                + '<ul>'
                + '<li><strong>12&ndash;10 mo:</strong> Set the budget, guest count &amp; date. Book venue and planner.</li>'
                + '<li><strong>9&ndash;8 mo:</strong> Lock photographer, caterer &amp; band/DJ. Start the dress hunt.</li>'
                + '<li><strong>7&ndash;6 mo:</strong> Send save-the-dates, book florist, officiant &amp; hotel blocks.</li>'
                + '<li><strong>5&ndash;4 mo:</strong> Order invitations, plan menu tasting, arrange transport.</li>'
                + '<li><strong>3&ndash;2 mo:</strong> Mail invites, finalize timeline, first dress fitting.</li>'
                + '<li><strong>1 mo &ndash; week of:</strong> Confirm counts &amp; vendors, build the day-of schedule, breathe. 🐝</li>'
                + '</ul>'
                + 'Want me to tailor this to your actual date?';
        }

        if (/(budget|cost|how much|price|\$|afford|150 guests|miami)/.test(t)) {
            return '<span class="lead">Here\'s a realistic <strong>budget snapshot for ~150 guests</strong> (a Miami celebration runs toward the higher end):</span>'
                + '<ul>'
                + '<li><strong>Venue &amp; catering (~50%):</strong> $28k&ndash;$45k</li>'
                + '<li><strong>Photo &amp; video (~12%):</strong> $6k&ndash;$11k</li>'
                + '<li><strong>Flowers &amp; decor (~10%):</strong> $5k&ndash;$9k</li>'
                + '<li><strong>Music/entertainment (~8%):</strong> $3k&ndash;$7k</li>'
                + '<li><strong>Attire &amp; beauty (~7%):</strong> $3k&ndash;$6k</li>'
                + '<li><strong>Stationery, favors, extras (~8%):</strong> $3k&ndash;$6k</li>'
                + '<li><strong>~5% buffer:</strong> always keep one!</li>'
                + '</ul>'
                + 'Ballpark total: <strong>$55k&ndash;$90k</strong>. Tell me your target number and I\'ll help you fit it.';
        }

        if (/(book first|first thing|priority|what.*(first|order)|start with)/.test(t)) {
            return '<span class="lead">Book in <strong>this order</strong> &mdash; the items that sell out first:</span>'
                + '<ul>'
                + '<li><strong>1. Venue + date</strong> &mdash; everything else keys off this.</li>'
                + '<li><strong>2. Planner</strong> &mdash; earlier means more help and less stress.</li>'
                + '<li><strong>3. Photographer</strong> &mdash; the good ones book 12+ months out.</li>'
                + '<li><strong>4. Caterer</strong> (if not in-house).</li>'
                + '<li><strong>5. Band or DJ</strong>, then florist.</li>'
                + '</ul>'
                + 'Have a date and city yet? I\'ll help you prioritize from there.';
        }

        if (/(minimalist|modern|simple|clean|understated|elegant vibe)/.test(t)) {
            return '<span class="lead">A <strong>modern minimalist</strong> wedding is all about restraint done beautifully:</span>'
                + '<ul>'
                + '<li><strong>Palette:</strong> white + one accent (sage, terracotta or black-tie ink).</li>'
                + '<li><strong>Florals:</strong> a few statement stems &mdash; think single-variety and architectural.</li>'
                + '<li><strong>Stationery:</strong> heavy cardstock, clean type, lots of negative space.</li>'
                + '<li><strong>Venue:</strong> galleries, lofts or bright modern spaces that need little dressing.</li>'
                + '<li><strong>Details:</strong> taper candles, sleek glassware, one gorgeous focal moment.</li>'
                + '</ul>'
                + 'Want a mood board of vendors who nail this look?';
        }

        if (/(day[-\s]?of|schedule|timeline for the day|run\s?of\s?show|itinerary)/.test(t)) {
            return '<span class="lead">Here\'s a clean <strong>day-of schedule</strong> for an evening ceremony:</span>'
                + '<ul>'
                + '<li><strong>1:00p</strong> Hair &amp; makeup begins</li>'
                + '<li><strong>3:00p</strong> Photographer arrives, detail shots</li>'
                + '<li><strong>4:00p</strong> First look &amp; wedding-party photos</li>'
                + '<li><strong>5:00p</strong> Guests arrive</li>'
                + '<li><strong>5:30p</strong> Ceremony</li>'
                + '<li><strong>6:00p</strong> Cocktail hour + family photos</li>'
                + '<li><strong>7:00p</strong> Reception entrance &amp; first dance</li>'
                + '<li><strong>7:30p</strong> Dinner &amp; toasts</li>'
                + '<li><strong>8:30p</strong> Cake, open dancing</li>'
                + '<li><strong>10:30p</strong> Grand send-off ✨</li>'
                + '</ul>'
                + 'Give me your ceremony time and I\'ll rebuild this around it.';
        }

        if (/(hello|hi|hey|help|start|who are you|your name)/.test(t)) {
            return 'Hi, I\'m <strong>Bee</strong> 🐝 your wedding planning assistant. Tell me your <strong>date</strong>, <strong>city</strong>, <strong>guest count</strong> and <strong>vibe</strong>, and I\'ll help with timelines, budgets, checklists and vendor ideas. What are we planning?';
        }

        return 'Great question! I can help with <strong>timelines, budgets, checklists, day-of schedules</strong> and <strong>vendor ideas</strong>. '
            + 'Tell me a bit about your wedding &mdash; date, city, guest count and the vibe you\'re going for &mdash; and I\'ll give you tailored guidance. '
            + 'You can also tap one of the suggestions above to get started. 🐝';
    }

    function send(text) {
        text = (text || '').trim();
        if (!text) return;
        addMessage('user', esc(text));
        input.value = '';
        var typing = showTyping();
        var reply = beeReply(text);
        setTimeout(function () {
            if (typing && typing.parentNode) typing.parentNode.removeChild(typing);
            addMessage('bee', reply);
        }, 650);
    }

    // Bee's greeting (exactly as requested)
    addMessage('bee', 'Hello! My name is <strong>Bee</strong>, your wedding planning assistant. 🐝 '
        + 'Tell me about your wedding &mdash; a date, a city, a guest count, a vibe &mdash; and I\'ll help with '
        + 'timelines, budgets, checklists and vendor ideas. What are we planning?');

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        send(input.value);
    });

    chips.addEventListener('click', function (e) {
        if (e.target && e.target.classList.contains('chip')) {
            send(e.target.textContent);
        }
    });

    // ---- Lead capture ----
    var leadForm = document.getElementById('leadForm');
    var leadCard = document.getElementById('leadCapture');
    var leadStatus = document.getElementById('leadStatus');
    var leadSubmit = document.getElementById('leadSubmit');

    function setStatus(msg, kind) {
        leadStatus.textContent = msg;
        leadStatus.className = 'lead-status' + (kind ? ' ' + kind : '');
    }

    leadForm.addEventListener('submit', function (e) {
        e.preventDefault();

        var payload = {
            name: document.getElementById('leadName').value.trim(),
            email: document.getElementById('leadEmail').value.trim(),
            message: document.getElementById('leadMessage').value.trim(),
            company: leadForm.elements['company'].value // honeypot
        };

        if (!payload.name || !payload.email) {
            setStatus('Please add your name and email.', 'err');
            return;
        }

        leadSubmit.disabled = true;
        setStatus('Sending…', '');

        fetch('/api/v1/planner/lead', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify(payload)
        })
        .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, body: d }; }); })
        .then(function (res) {
            if (res.ok && res.body && res.body.ok) {
                leadCard.classList.add('done');
                setStatus(res.body.message || 'Thanks! We\'ll be in touch soon. 🐝', 'ok');
                // Bee acknowledges in the chat too.
                addMessage('bee', 'Thanks, <strong>' + esc(payload.name) + '</strong>! I\'ve passed your details to the Bridal Team — someone will reach out at <strong>' + esc(payload.email) + '</strong> soon. 🐝');
            } else {
                var err = (res.body && res.body.errors)
                    ? 'Please double-check your name and a valid email.'
                    : 'Something went wrong. Please try again.';
                setStatus(err, 'err');
                leadSubmit.disabled = false;
            }
        })
        .catch(function () {
            setStatus('Network error — please try again.', 'err');
            leadSubmit.disabled = false;
        });
    });
})();
</script>
@endverbatim
@endsection
