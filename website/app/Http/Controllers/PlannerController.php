<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

use App\Http\Controllers\Controller;
use App\PlannerLead;
use App\Classes\EmailSystem;

class PlannerController extends Controller
{
    /**
     * Capture a lead from the AI Wedding Planner ("Bee") page.
     *
     * Kept deliberately resilient: leads are always written to a local
     * fallback file so nothing is lost if the database is unreachable or the
     * planner_leads migration hasn't been run yet. Admin email is best-effort.
     */
    public function storeLead(Request $request)
    {
        // Honeypot: bots fill hidden fields; humans leave them empty.
        if ($request->filled('company')) {
            return response()->json(['ok' => true]);
        }

        $validator = validator($request->all(), [
            'name'    => 'required|string|max:120',
            'email'   => 'required|email|max:190',
            'message' => 'nullable|string|max:2000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'ok'     => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $data = [
            'name'    => trim($request->input('name')),
            'email'   => trim($request->input('email')),
            'message' => $request->input('message') ? trim($request->input('message')) : null,
            'source'  => 'planner',
        ];

        // 1) Always persist to a local fallback file so a lead is never lost.
        $this->appendFallback($data);

        // 2) Best-effort: save to the database.
        try {
            PlannerLead::create($data);
        } catch (\Exception $e) {
            Log::warning('PlannerLead DB save failed: ' . $e->getMessage());
        }

        // 3) Best-effort: notify the Bridal Team inbox.
        try {
            $subject = 'New AI Planner lead: ' . $data['name'];
            $body = "A couple left their details on the AI Wedding Planner page.\n\n"
                . "Name: {$data['name']}\n"
                . "Email: {$data['email']}\n"
                . 'Message: ' . ($data['message'] ?: '(none)') . "\n";
            EmailSystem::sendAdminEmail($subject, nl2br(e($body)));
        } catch (\Exception $e) {
            Log::warning('PlannerLead admin email failed: ' . $e->getMessage());
        }

        return response()->json([
            'ok'      => true,
            'message' => "Thanks, {$data['name']}! Bridal Team will be in touch soon.",
        ]);
    }

    /**
     * Append the lead to storage/app/planner-leads.jsonl.
     */
    private function appendFallback(array $data)
    {
        try {
            $line = json_encode(array_merge($data, [
                'received_at' => date('c'),
            ])) . "\n";
            Storage::append('planner-leads.jsonl', rtrim($line, "\n"));
        } catch (\Exception $e) {
            Log::error('PlannerLead fallback write failed: ' . $e->getMessage());
        }
    }
}
