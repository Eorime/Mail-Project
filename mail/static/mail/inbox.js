document.addEventListener("DOMContentLoaded", function () {
	//Buttons

	//navigation
	const inboxBtn = document.querySelector("#inbox");
	const sentBtn = document.querySelector("#sent");
	const archivedBtn = document.querySelector("#archived");
	const composeBtn = document.querySelector("#compose");

	//others
	const sendBtn = document.querySelector("#send-btn");

	// Use buttons to toggle between views
	inboxBtn.addEventListener("click", () => load_mailbox("inbox"));
	sentBtn.addEventListener("click", () => load_mailbox("sent"));
	archivedBtn.addEventListener("click", () => load_mailbox("archive"));
	composeBtn.addEventListener("click", compose_email);

	sendBtn.addEventListener("click", sendMail);

	// By default, load the inbox
	load_mailbox("inbox");
});

//Functions

function compose_email(replyTo = null) {
	// Show compose view and hide other views
	document.querySelector("#emails-view").style.display = "none";
	document.querySelector("#compose-view").style.display = "block";
	document.querySelector("#one-email-view").style.display = "none";

	// Clear out composition fields
	document.querySelector("#compose-recipients").value = "";
	document.querySelector("#compose-subject").value = "";
	document.querySelector("#compose-body").value = "";

	if (replyTo) {
		//if theres a parameter present, then fill values
		document.querySelector("#compose-recipients").value = replyTo.sender;
		document.querySelector("#compose-subject").value =
			replyTo.subject.startsWith("Re: ")
				? replyTo.subject
				: `Re: ${replyTo.subject}`;
		document.querySelector(
			"#compose-body"
		).value = `\n\nOn ${replyTo.timestamp} ${replyTo.sender} wrote:\n${replyTo.body}`;
	}
}

function load_mailbox(mailbox) {
	// Show the mailbox and hide other views
	document.querySelector("#emails-view").style.display = "block";
	document.querySelector("#compose-view").style.display = "none";
	document.querySelector("#one-email-view").style.display = "none";

	// Show the mailbox name
	document.querySelector("#emails-view").innerHTML = `<h3>${
		mailbox.charAt(0).toUpperCase() + mailbox.slice(1)
	}</h3>
	        <div id="email-list"></div>
`;

	let data;

	async function loadInbox() {
		if (mailbox === "inbox") {
			const response = await fetch("/emails/inbox");
			data = await response.json();
			return data;
		}
		if (mailbox === "sent") {
			const response = await fetch("/emails/sent");
			data = await response.json();
			return data;
		}
		if (mailbox === "archive") {
			console.log("archive var");
			const response = await fetch("/emails/archive");
			data = await response.json();
			return data;
		}
	}

	loadInbox().then(() => {
		document.querySelector("#email-list").innerHTML = `
		<div>
		  ${data
				.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
				.map(
					(each) => `
				<div class="inbox-mail ${each.read ? "read-mail" : ""}"} data-id="${each.id}">
				  <div class="a-side">
					<p><strong>${each.sender}</strong></p>
					<p>${each.subject}</p>
				  </div>
				  <p class="time-stamp-all">${each.timestamp}</p>
				</div>
			  `
				)
				.join("")}
		</div>
	  `;

		document.querySelectorAll(".inbox-mail").forEach((emailElement) => {
			emailElement.addEventListener("click", () => {
				const emailId = emailElement.getAttribute("data-id");
				load_email(emailId);
			});
		});
	});
}

function load_email(email_id) {
	document.querySelector("#emails-view").style.display = "none";
	document.querySelector("#compose-view").style.display = "none";
	document.querySelector("#one-email-view").style.display = "block";

	let email;

	async function showEmail() {
		const response = await fetch(`/emails/${email_id}`);
		email = await response.json();
		return email;
	}

	function markAsRead() {
		fetch(`/emails/${email_id}`, {
			method: "PUT",
			body: JSON.stringify({
				read: true,
			}),
		});
	}

	markAsRead();

	showEmail().then(() => {
		const archiveButton = !email.archived
			? `<button id="archive-btn" class="btn btn-sm btn-outline-primary">Archive</button>`
			: `<button id="archive-btn" class="btn btn-sm btn-outline-secondary">Unarchive</button>`;
		document.querySelector(
			"#one-email-view"
		).innerHTML = `<p> <strong> From: </strong> ${email.sender}</p>
			<p> <strong> To: </strong> ${email.recipients.join(", ")}</p>
			<p> <strong> Subject: </strong> ${email.subject}</p>
			<p> <strong> Timestamp: </strong> ${email.timestamp}</p>
			<div class="btn-container"> 
				<button id="reply-btn" class="btn btn-sm btn-outline-primary">Reply</button>
				${archiveButton}
			</div>
			<hr>
			<p>${email.body}</p>
			`;
		document.querySelector("#archive-btn").addEventListener("click", () => {
			fetch(`/emails/${email_id}`, {
				method: "PUT",
				body: JSON.stringify({
					archived: !email.archived,
				}),
			}).then(() => {
				load_mailbox("inbox");
			});
		});
		document.querySelector("#reply-btn").addEventListener("click", () => {
			compose_email(email); //when clicked on reply, pass email as the argument
		});
	});
}

//function to handle email sending
function sendMail(e) {
	const recipientsVal = document.querySelector("#compose-recipients").value;
	const subjectVal = document.querySelector("#compose-subject").value;
	const bodyVal = document.querySelector("#compose-body").value;

	e.preventDefault();

	//Check if the fields are empty
	if (recipientsVal == "" || subjectVal == "" || bodyVal == "") {
		alert("Please fill all the fields.");
	} else {
		fetch("/emails", {
			method: "POST",
			body: JSON.stringify({
				recipients: recipientsVal,
				subject: subjectVal,
				body: bodyVal,
			}),
		})
			.then((response) => response.json())
			.then((result) => {});
		load_mailbox("sent");
	}
}
