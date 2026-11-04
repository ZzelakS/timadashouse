// Transcribed from the supplied images. Preserve wording, including original names and typos.
export const imagePolicies = [
  {
    title: "SCHEDULING POLICY.",
    text: "All appointments require a non-refundable deposit and a credit or debit card to be placed on file to confirm your appointment. You appointment will not be confirmed unless a deposit and card is placed on file.You may use our other payment options to pay your balance. We accept cash or a credit/debit card.",
  },
  {
    title: "APPOINTMENT POLICY.",
    text: "Please do not bring additional guests or children to your appointment. If you arrive early to your appointment, please feel free to wait in our lobby area located in the front of our salon as we may be finishing up with a client. At your appointment start time, we will come and greet you and take you back to our treatment room to start your service.",
  },
  {
    title: "APPOINTMENT CANCELLATION POLICY.",
    text: "All appointments must be canceled or rescheduled at least 24 hours prior to your scheduled appointment or your deposit will be forfeited. If you do not cancel your appointment within the 24 hour time frame, you will forfeit your deposit and will be charged a cancellation fee which is 50% of your booked service. Same day cancellations or no call/no show will result in a forfeited deposit and 100% of remaining balance will be charged. You will be prohibited from booking in the future.\n\nIf you are more than 20 minutes late to your appointment, your appointment could be canceled and deposit forfeited. You will be required to book a new appointment and place a new deposit. We understand that things can happen, so please contact us to let us know if you will be running late.",
  },
  {
    title: "TRAINING CANCELLATION POLICY.",
    text: "All training must be canceled or rescheduled within 14 days of the confirmed dates. Any training that is canceled less than the 14 day grace period will result in a loss of deposit and 50% of remaining balance will be due. You are able to reschedule your training dates ONCE. A total of 50% of the remaining balance will be due in order to reschedule your training to a new date. If you cancel your training after rescheduling, you will forfeit your deposit and the 50% of the remaining balance that was required to reschedule (To schedule a training in the future, the full balance must be paid before confirming your new training dates).",
  },
  {
    title: "CONSENT POLICY.",
    text: "For all permanent makeup procedures, a consent form must be completed. Please bring a valid photo ID— Timadas House will need a copy of it for our records. Your information will not be shared. If you are a minor, an adult must accompany you and bring a valid ID. Please be sure to answer all questions regarding health background prior to receiving services. Any pictures and videos taken during the procedure will be used for our records and social media marketing. You can opt out of using your pictures for use on social media. Please let us know at your appointment.",
  },
  {
    title: "REFUND POLICY.",
    text: "There are absolutely no refunds on all services, training or products. Returns of products must be returned within thirty days. You will receive a store credit that can be used on eligible store products. No refunds on digital products or downloads.",
  },
] as const;

export const policyText = [
  "OUR POLICIES.",
  ...imagePolicies.flatMap((p) => [p.title, p.text]),
].join("\n\n");
