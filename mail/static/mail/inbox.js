document.addEventListener('DOMContentLoaded', function() {

    // Use buttons to toggle between views
    document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
    document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
    document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
    document.querySelector('#compose').addEventListener('click', compose_email);
    document.querySelector('#compose-form').addEventListener('submit', send_mail);

    // By default, load the inbox
    load_mailbox('inbox');
});

function compose_email() {

    // Show compose view and hide other views
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#single-email-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'block';

    // Clear out composition fields
    document.querySelector('#compose-recipients').value = '';
    document.querySelector('#compose-subject').value = '';
    document.querySelector('#compose-body').value = '';

}

function load_mailbox(mailbox) {
  
    // Show the mailbox and hide other views
    document.querySelector('#emails-view').style.display = 'block';
    document.querySelector('#compose-view').style.display = 'none';
    document.querySelector('#single-email-view').style.display = 'none';

    // Show the mailbox name
    document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

    fetch(`/emails/${mailbox}`)
    .then(response => response.json())
    .then(emails => {
        emails.forEach(email => {
            // create element for data and then insert into dom area
            const emailContainer = document.createElement('div');
            emailContainer.className = email.read ? 'email-read' : 'email-unread';
            emailContainer.classList.add('email-container');
            emailContainer.innerHTML = `
            <p>From: ${email.sender}</p>
            <p>Subject: ${email.subject}</p>
            <p>Message: ${email.body}</p>
            <p>Time: ${email.timestamp}</p>
            `;

            // handle archiving
            const archiveButton = document.createElement('button');
            archiveButton.innerHTML = email.archived ? 'Unarchive' : 'Archive';
            archiveButton.addEventListener('click', function(event) {
                // stop event from bubbling and affecting the container
                event.stopPropagation();
                if (email.archived == true) {
                    remove_archive(email.id);
                } else {
                    add_archive(email.id);
                }
            });
            emailContainer.append(archiveButton);

            // if single message clicked it will load a different view and mark as read 
            emailContainer.addEventListener('click', function() {
                load_message(email.id);
                mark_read(email.id);
            });  

            // add post to DOM with append
            document.querySelector('#emails-view').append(emailContainer);
        });  
    });
}

function load_message(id) {
    fetch(`/emails/${id}`)
                .then(response => response.json())
                .then(singleEmail => {

                    // Show the mailbox and hide other views
                    document.querySelector('#emails-view').style.display = 'none';
                    document.querySelector('#compose-view').style.display = 'none';
                    document.querySelector('#single-email-view').style.display = 'block';
                    document.querySelector('#single-email-view').innerHTML = '<h3>Viewing Message</h3>';
                    
                    const singleEmailContainer = document.createElement('div'); 
                    singleEmailContainer.className = singleEmail.read ? 'email-read' : 'email-unread';
                    singleEmailContainer.classList.add('email-container');
                    
                    singleEmailContainer.innerHTML = `
                    <p>From: ${singleEmail.sender}</p>
                    <p>To: ${singleEmail.recipients}</p>
                    <p>Subject: ${singleEmail.subject}</p>
                    <p>Message: ${singleEmail.body}</p>
                    <p>Time: ${singleEmail.timestamp}</p>
                    `;

                    // handle archiving
                    const archiveButton = document.createElement('button');
                    archiveButton.innerHTML = singleEmail.archived ? 'Unarchive' : 'Archive';
                    archiveButton.addEventListener('click', function() {

                        if (singleEmail.archived == true) {
                            remove_archive(singleEmail.id);
                        } else {
                            add_archive(singleEmail.id);
                        }

                    });

                    // handle reply
                    const replyButton = document.createElement('button');
                    replyButton.classList.add('reply');
                    replyButton.innerHTML = "Reply";
                    replyButton.addEventListener('click', function() {
                        reply(singleEmail);
                    });

                    // append buttons to container and container to view
                    singleEmailContainer.append(archiveButton);
                    singleEmailContainer.append(replyButton);

                    document.querySelector('#single-email-view').append(singleEmailContainer);

                });
       
}

function send_mail(event) {
    event.preventDefault();
    // Get composition fields
    let recipient = document.querySelector('#compose-recipients').value;
    let subject = document.querySelector('#compose-subject').value;
    let message = document.querySelector('#compose-body').value;

    fetch('/emails', {
        method: 'POST',
        body: JSON.stringify({
            recipients: recipient,
            subject: subject,
            body: message
        })
    })
    .then(response => response.json())
    .then(() => {
        load_mailbox('sent');
    });

}

function reply(email) {
    // Start by changing the view
    compose_email();
    console.log(email);
    // Fill in fields for reply message
    document.querySelector('#compose-recipients').value = email.sender;
    let body = `On ${email.timestamp} ${email.sender} wrote: ${email.body}`
    document.querySelector('#compose-body').value = body;


    if (!email.subject.includes('Re:')) {
        let subject = `Re: ${email.subject}`;
        document.querySelector('#compose-subject').value = subject;
    } else {
        let subject = email.subject;
        document.querySelector('#compose-subject').value = subject;
    }
}

function mark_read(id) {
    fetch(`/emails/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
            read: true
        })
      })
}

function add_archive(id) {
    fetch(`/emails/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
            archived: true
        })
    })
    .then(() => {
        load_mailbox('inbox');
    })
}


function remove_archive(id) {
    fetch(`/emails/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
            archived: false
        })
      })
      .then(() => {
        load_mailbox('inbox');
    })
}