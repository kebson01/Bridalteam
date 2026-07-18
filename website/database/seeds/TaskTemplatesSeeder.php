<?php

use Illuminate\Database\Seeder;
use App\TaskTemplate;

/**
 * A real-world wedding planning starter checklist. Offsets are days BEFORE
 * the wedding date; the app derives each task's due date from the couple's
 * wedding date minus the offset. Items flagged with applies_if only appear
 * when the condition matches (e.g. larger weddings).
 */
class TaskTemplatesSeeder extends Seeder
{
    public function run()
    {
        // Idempotent: the catalog is seeded once. Safe to call on every boot.
        if (TaskTemplate::count() > 0) {
            return;
        }

        $templates = [
            // ~12+ months out (offset ~365)
            ['Set your overall budget', 'Decide the total you can spend and who is contributing. Everything else flows from this.', 'budget', '12mo_plus', 365, 'high', null],
            ['Draft a rough guest list', 'An early headcount drives venue size, catering, and cost.', 'guests', '12mo_plus', 365, 'high', null],
            ['Choose your wedding style/vibe', 'Rustic, modern, classic, beach — sets the tone for everything.', 'planning', '12mo_plus', 360, 'normal', null],
            ['Pick a few possible dates', 'Have 2-3 options before you tour venues.', 'planning', '12mo_plus', 360, 'high', null],
            ['Research and tour venues', 'Book early — popular venues fill 12+ months out.', 'venue', '12mo_plus', 340, 'high', null],
            ['Book your ceremony & reception venue', 'The single biggest decision; locks in your date.', 'venue', '12mo_plus', 330, 'high', null],

            // ~9 months out (offset ~270)
            ['Book your photographer', 'Great photographers book up first.', 'photography', '9mo', 270, 'high', null],
            ['Book your caterer', 'Schedule a tasting before you commit.', 'catering', '9mo', 270, 'high', null],
            ['Book entertainment (DJ or band)', 'Secure your music/entertainment early.', 'entertainment', '9mo', 260, 'normal', null],
            ['Start shopping for your wedding dress/attire', 'Gowns can take 6-9 months to order and alter.', 'attire', '9mo', 255, 'high', null],
            ['Book a videographer', 'Optional but books up alongside photographers.', 'photography', '9mo', 250, 'low', null],
            ['Reserve a block of hotel rooms', 'For out-of-town guests.', 'guests', '9mo', 240, 'normal', '{"min_guests":75}'],

            // ~6 months out (offset ~180)
            ['Order invitations & stationery', 'Save-the-dates and invitations.', 'stationery', '6mo', 180, 'normal', null],
            ['Send save-the-dates', 'Especially important for destination or holiday weddings.', 'stationery', '6mo', 175, 'normal', null],
            ['Book florist', 'Bouquets, centerpieces, ceremony flowers.', 'flowers', '6mo', 170, 'normal', null],
            ['Book officiant', 'Confirm who is marrying you and their requirements.', 'legal', '6mo', 165, 'high', null],
            ['Order the wedding cake', 'Schedule a tasting.', 'catering', '6mo', 160, 'normal', null],
            ['Arrange transportation', 'Getting the couple and party to/from the venue.', 'logistics', '6mo', 150, 'low', null],
            ['Plan the honeymoon', 'Book flights and lodging; check passport validity.', 'honeymoon', '6mo', 150, 'normal', null],

            // ~3 months out (offset ~90)
            ['Finalize the guest list', 'Lock numbers for catering and seating.', 'guests', '3mo', 90, 'high', null],
            ['Send invitations', 'Mail 6-8 weeks before the wedding.', 'stationery', '3mo', 75, 'high', null],
            ['Buy wedding rings', 'Allow time for sizing and engraving.', 'attire', '3mo', 90, 'normal', null],
            ['Purchase marriage license', 'Check your county rules — many expire, so time it right.', 'legal', '3mo', 60, 'high', null],
            ['Plan the rehearsal dinner', 'Book the venue and invite the wedding party.', 'events', '3mo', 75, 'normal', null],
            ['Confirm vendor meals', "Don't forget to feed your photographer, DJ, and coordinator.", 'catering', '3mo', 60, 'normal', null],
            ['Arrange a weather/backup plan', 'For outdoor ceremonies — tent or indoor option.', 'logistics', '3mo', 60, 'normal', null],

            // ~1 month out (offset ~30)
            ['Confirm final headcount with caterer', 'Give your final numbers.', 'catering', '1mo', 21, 'high', null],
            ['Create the seating chart', 'Assign tables once RSVPs are in.', 'guests', '1mo', 21, 'normal', null],
            ['Final dress/suit fitting', 'Make sure everything fits perfectly.', 'attire', '1mo', 21, 'high', null],
            ['Confirm details with all vendors', 'Timeline, arrival times, contacts, balances due.', 'logistics', '1mo', 14, 'high', null],
            ['Write your vows', 'If writing your own, give yourself time.', 'planning', '1mo', 21, 'normal', null],
            ['Buy gifts for the wedding party', 'A thank-you for your bridesmaids and groomsmen.', 'gifts', '1mo', 21, 'low', null],
            ['Prepare final payments & gratuities', 'Set aside tips/cash for vendors on the day.', 'budget', '1mo', 10, 'high', null],

            // Week of (offset ~5)
            ['Confirm day-of timeline with everyone', 'Share the schedule with party and vendors.', 'logistics', 'week_of', 5, 'high', null],
            ['Pack for the honeymoon', 'And confirm travel documents.', 'honeymoon', 'week_of', 4, 'normal', null],
            ['Delegate day-of point person', 'Someone to handle questions so you can relax.', 'logistics', 'week_of', 3, 'high', null],
            ['Pick up attire and rings', 'Have everything in hand.', 'attire', 'week_of', 2, 'high', null],

            // Day of (offset 0)
            ['Give rings to the best man/officiant', 'So they are ready for the ceremony.', 'day_of', 'day_of', 0, 'high', null],
            ['Eat and stay hydrated', "It's a long day — take care of yourself.", 'day_of', 'day_of', 0, 'normal', null],

            // After (negative offset = after the date)
            ['Send thank-you cards', 'Within a few weeks of the wedding.', 'stationery', 'after', -21, 'normal', null],
            ['Return any rentals', 'Suits, decor, and other rented items.', 'logistics', 'after', -3, 'low', null],
            ['Preserve your dress and bouquet', 'If you want to keep them.', 'after', 'after', -14, 'low', null],
        ];

        $order = 0;
        foreach ($templates as $t) {
            $order += 10;
            TaskTemplate::create([
                'title'                => $t[0],
                'description'          => $t[1],
                'category'             => $t[2],
                'timeline_bucket'      => $t[3],
                'timeline_offset_days' => $t[4],
                'default_priority'     => $t[5],
                'applies_if'           => $t[6],
                'sort_order'           => $order,
            ]);
        }
    }
}
