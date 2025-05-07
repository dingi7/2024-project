package util

import (
	"fmt"
	"os"

	resend "github.com/resend/resend-go/v2"
)

func SendAdminInviteEmail(toEmail string, inviteLink string) error {
	apiKey := os.Getenv("RESEND_API_KEY")
	from := os.Getenv("RESEND_FROM_EMAIL") // e.g. "YourApp <noreply@yourdomain.com>"

	client := resend.NewClient(apiKey)

	params := &resend.SendEmailRequest{
		From:    from,
		To:      []string{toEmail},
		Subject: "You're invited to be an Admin",
		Html: fmt.Sprintf(`
			<div style="font-family: Arial, sans-serif; background: #f9fafb; padding: 32px;">
				<div style="max-width: 480px; margin: auto; background: #fff; border-radius: 12px; box-shadow: 0 2px 8px #e5e7eb; padding: 32px;">
					<h2 style="color: #1d4ed8; margin-bottom: 16px;">Admin Invitation</h2>
					<p style="font-size: 16px; color: #374151; margin-bottom: 24px;">
						You have been invited to become an <b>admin</b> on <span style="color: #1d4ed8;">Contestify</span>!
					</p>
					<a href="%s" style="display: inline-block; background: #1d4ed8; color: #fff; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-weight: bold; font-size: 16px;">
						Accept Admin Invite
					</a>
					<p style="font-size: 13px; color: #6b7280; margin-top: 32px;">
						If you did not expect this email, you can safely ignore it.
					</p>
				</div>
			</div>
		`, inviteLink),
	}

	_, err := client.Emails.Send(params)
	return err
}

func SendContestInviteEmail(toEmail string, contestTitle string, contestID string) error {
	apiKey := os.Getenv("RESEND_API_KEY")
	from := os.Getenv("RESEND_FROM_EMAIL") // e.g. "YourApp <noreply@yourdomain.com>"

	client := resend.NewClient(apiKey)

	contestLink := fmt.Sprintf("%s/contest/%s", os.Getenv("FRONTEND_URL"), contestID)

	params := &resend.SendEmailRequest{
		From:    from,
		To:      []string{toEmail},
		Subject: fmt.Sprintf("You're invited to %s", contestTitle),
		Html: fmt.Sprintf(`
			<div style="font-family: Arial, sans-serif; background: #f9fafb; padding: 32px;">
				<div style="max-width: 480px; margin: auto; background: #fff; border-radius: 12px; box-shadow: 0 2px 8px #e5e7eb; padding: 32px;">
					<h2 style="color: #16a34a; margin-bottom: 16px;">Contest Invitation</h2>
					<p style="font-size: 16px; color: #374151; margin-bottom: 24px;">
						You have been invited to participate in the contest <b>%s</b> on <span style="color: #16a34a;">Contestify</span>!
					</p>
					<a href="%s" style="display: inline-block; background: #16a34a; color: #fff; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-weight: bold; font-size: 16px;">
						View Contest
					</a>
					<p style="font-size: 13px; color: #6b7280; margin-top: 32px;">
						If you did not expect this email, you can safely ignore it.
					</p>
				</div>
			</div>
		`, contestTitle, contestLink),
	}

	_, err := client.Emails.Send(params)
	return err
}
