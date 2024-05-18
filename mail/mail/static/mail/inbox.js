document.addEventListener('DOMContentLoaded', function() {
  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', () => compose_email()); // Fix: Call compose_email without arguments

  document.querySelector('#compose-form').addEventListener('submit', send_email);

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email(recipients = 'to', subject = '', body = '') {
  console.log('compose_email called with:', recipients, subject, body); // Debugging: Log parameters
  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#emails-detail-view').style.display = 'none';

  // Clear out composition fields or pre-fill them if arguments are provided
  document.querySelector('#compose-recipients').value = recipients;
  document.querySelector('#compose-subject').value = subject;
  document.querySelector('#compose-body').value = body;
}

function view_email(id) {
  fetch(`/emails/${id}`)
    .then(response => response.json())
    .then(email => {
      console.log(email); // Debugging: Log email details

      // Show email detail view and hide other views
      document.querySelector('#emails-view').style.display = 'none';
      document.querySelector('#compose-view').style.display = 'none';
      document.querySelector('#emails-detail-view').style.display = 'block';

      // Populate email detail view
      document.querySelector('#emails-detail-view').innerHTML = `
        <div>
          <strong>From:</strong> ${email.sender}<br>
          <strong>To:</strong> ${email.recipients.join(', ')}<br>
          <strong>Subject:</strong> ${email.subject}<br>
          <strong>Timestamp:</strong> ${email.timestamp}<br>
          <hr>
          <p>${email.body}</p>
        </div>
      `;

      // Mark the email as read after viewing
      if (!email.read) {
        fetch(`/emails/${id}`, {
          method: 'PUT',
          body: JSON.stringify({
            read: true
          })
        }).then(() => {
          // Change the email div to read
          const emailDiv = document.querySelector(`#email-${id}`);
          if (emailDiv) {
            emailDiv.classList.remove('unread');
            emailDiv.classList.add('read');
          }
        });
      }

      // Create archive/unarchive button
      const btnArch = document.createElement('button');
      btnArch.innerHTML = email.archived ? "Unarchive" : "Archive";
      btnArch.className = email.archived ? "btn btn-success" : "btn btn-danger";
      btnArch.addEventListener('click', function() {
        fetch(`/emails/${id}`, {
          method: 'PUT',
          body: JSON.stringify({
            archived: !email.archived
          })
        }).then(() => {
          // Reload the inbox after archiving/unarchiving
          load_mailbox('inbox');
        });
      });

      // Append archive/unarchive button to email detail view
      document.querySelector('#emails-detail-view').append(btnArch);

      // Create reply button
      const btnReply = document.createElement('button');
      btnReply.innerHTML = "Reply";
      btnReply.className = "btn btn-primary";
      btnReply.addEventListener('click', function() {
        const replyRecipients = email.sender;
        let replySubject = email.subject;
        if (!replySubject.startsWith("Re: ")) {
          replySubject = "Re: " + replySubject;
        }
        const replyBody = `\n\nOn ${email.timestamp}, ${email.sender} wrote:\n${email.body}`;
        compose_email(replyRecipients, replySubject, replyBody);
      });

      // Append reply button to email detail view
      document.querySelector('#emails-detail-view').append(btnReply);
    })
    .catch(error => {
      console.error('Error:', error);
    });
}

function load_mailbox(mailbox) {
  console.log('load_mailbox called with:', mailbox); // Debugging: Log mailbox name
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#emails-detail-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // Get the emails for that mailbox and user
  fetch(`/emails/${mailbox}`)
    .then(response => response.json())
    .then(emails => {
      console.log(emails); // Debugging: Log the emails

      // Clear the current emails view
      document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

      // Loop through emails and create a div for each
      emails.forEach(singleEmail => {
        // Create div for each email
        const newEmail = document.createElement('div');
        newEmail.id = `email-${singleEmail.id}`;
        newEmail.className = `list-group-item border ${singleEmail.read ? 'read' : 'unread'}`;
        newEmail.innerHTML = `
          <h6>Sender: ${singleEmail.sender}</h6>
          <h5>Subject: ${singleEmail.subject}</h5>
          <p>${singleEmail.timestamp}</p>
        `;

        // Add click event to view email
        newEmail.addEventListener('click', () => view_email(singleEmail.id));

        document.querySelector('#emails-view').append(newEmail);
      });
    })
    .catch(error => {
      console.error('Error:', error);
    });
}

function send_email(event) {
  event.preventDefault();

  // Store fields
  const recipients = document.querySelector('#compose-recipients').value;
  const subject = document.querySelector('#compose-subject').value;
  const body = document.querySelector('#compose-body').value;

  // Send data to backend
  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
      recipients: recipients,
      subject: subject,
      body: body
    })
  })
    .then(response => response.json())
    .then(result => {
      console.log(result); // Debugging: Print result
      load_mailbox('sent');
    })
    .catch(error => {
      console.error('Error:', error);
    });
}
