import React from 'react';

/*
 * Canonical subscription / cancellation / refund policy shown to vendors.
 *
 * Rendered at checkout, on the cancel-subscription confirmation and in the
 * account settings so the "no refund once a new billing cycle begins" terms
 * are always visible before a vendor is charged or cancels.
 *
 * Pass compact={true} for the short inline version used on the checkout
 * review screen.
 */
var RefundPolicy = (props) => {
    if(props.compact){
        return (
            <div className="refundpolicy compact">
                <p>
                    <strong>Subscription &amp; refund policy:</strong> Your subscription
                    renews automatically for the plan term you selected until you cancel.
                    You can cancel anytime and keep access through the end of your current
                    paid period. <strong>All payments are non-refundable</strong> &mdash; once a
                    new billing cycle begins and your subscription renews, that charge is not
                    refundable. Cancel before your renewal date to avoid the next charge.
                </p>
            </div>
        );
    }

    return (
        <div className="refundpolicy">
            <h3>Subscription, Cancellation &amp; <span>Refund Policy</span></h3>
            <ul>
                <li>
                    Paid subscriptions are billed in advance and renew automatically for the
                    plan term you select (monthly, every 6 months, or annually) until you cancel.
                </li>
                <li>
                    You can cancel your subscription at any time. When you cancel, your
                    subscription stays active through the end of your current paid billing
                    period and will not renew afterward.
                </li>
                <li>
                    <strong>All payments are non-refundable.</strong> Once a new billing cycle
                    begins and your subscription renews, that payment has already been processed
                    for the upcoming term and cannot be refunded, in whole or in part.
                </li>
                <li>
                    Canceling, deactivating, or closing your account does not create a prorated
                    or partial refund for the remaining time in your current period &mdash; you
                    simply keep access until that period ends.
                </li>
                <li>
                    To avoid being charged for the next cycle, cancel before your renewal date.
                </li>
            </ul>
        </div>
    );
};

export default RefundPolicy;
