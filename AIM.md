# What is the aim of this application

It is an agent capable of testing and suggesting solutions to issues based on previous tests and results

## How Will I achieve this? What do I need?

Developers spend a lot of time testing what they write, and sometimes the problem they are facing is not new. It might be solved already or it might have an open ticket on jira explaining it.
To solve such an issue I am imagining an AI agent that does all of it for you.
Let's say the developer just makes a code edit. As soon as he/she is done they will ask Scout (name of the agent) to test some sequence of things. It will automatically create a JIRA ticket, build the code, put the binaries in a test environment (could be a seperate pc), agent in that test environment will perform the tests, it will analyse the logs based on rules/requirements/testcases. 

If the execution was a success it will fill in the important details in the ticket, (description, logs etc.), vectorise and store logs along with the ticket etc. for future execution uses and send a mail explaining the results. If execution does fail it should be able to look for similar failures if any from the vectoriesd database and notify the user with relevant information such as: "so and so failure was observed in this ticket or this person says do this and it would be okay or this thing was passing for this and this test for so and so version"

Most of the testing we do are over doip messages that are send via ethernet. So I want the agent to be able to choose the sequence of what needs to be run.
For example the user asks the agent to send 22 D0 5B message to ECU1 until it received 22 D0 00 it should be able to choose the routines and do it.

## Practically how to do it

I am thinking of multi-agent architecutre with a central agent controlling each based on job-id. It maintains seperate databases for execution reports (vecotrised db) and sql database for all the previous tickets, some file db to keep the logs. I also understand that I need to provide each of my agents with a seperate set of tools that will enable them to achive their tasks.
For example: agent1 that runs on users pc can just have tools to build/create/MR and schedule a job
    agent2 that runs on github can just see if an AI job is scheduled to run after ci completion it can notify the relevant agent to start
    agent3 that runs the busineess logic should have tools to decide the sequence and when it is done, observe the logs, send mail etc.

