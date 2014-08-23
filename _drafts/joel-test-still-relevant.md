---
layout: post
title: The Joel Test - Is it still relevant?
guest_author:
  name: Imran Shakir
  url: https://github.com/ishakir
---

Many of you have probably seen [The Joel Test](http://www.joelonsoftware.com/articles/fog0000000043.html), Joel Spolsky's *"twelve-question measure of the quality of a software team"*. This is included as a metric for companies posting jobs on [careers.stackoverflow.com](careers.stackoverflow.com).

At the time (August 2000 - 14 years ago at time of writing!), this was probably a great list. Now though, we feel it's somewhat out of date. Even [Joel admits](http://meta.stackexchange.com/a/109363) he might write a different list if he was doing it today. 

Now, we're not the first to make this observation:

- [Should the Joel Test on Careers be updated?](https://meta.stackexchange.com/questions/109280/should-the-joel-test-on-careers-be-updated)
- [The Joel test is antiquated](http://www.coriandertech.com/2011/11/05/the-joel-test-is-antiquated/)
- [The Joel Test - Updated for 2010](http://geekswithblogs.net/btudor/archive/2009/06/16/132842.aspx)

All excellent posts and worth reading. We're going to follow the trend and have a go at writing our own checklist, but first let's consider the original.

### 1. Do you use source control?
This is definitely still a requirement. But frankly, in the age of free GitHub repos, we take this for granted. How anyone can expect to function effectively without it is beyond us.

The bigger questions here are around *how* you use your source control. How easy is it to share code within your organisation? How well do you manage changes from multiple developers? Do your other tools integrate with your chosen source control software?

### 2. Can you make a build in one step?
An admirable aim, but we expect a bit more from our build automation now:

- a fully automated build
- a fully automated test suite
- triggered by commits to source control (preferably every commit)
- instant feedback on failing tests
- all the above for every supported platform

### 3. Do you make daily builds?
See above - daily isn't often enough anymore. It should probably be every commit. Additionally, builds should be isolated in such a way that no one else if affected when someone breaks the build.

### 4. Do you have a bug database?
Still relevant, but we'd like to see this integrated with general task management and source control systems.

### 5. Do you fix bugs before writing new code?
Again, admirable and still relevant. Especially the bit about being *"ready to ship at all times"*. However, we think bugs aren't the only problem here - any kind of technical debt can be killer.

### 6. Do you have an up-to-date schedule?
Arguably less important in the world of continuous delivery, since a slip in the schedule means a delay of days or weeks, rather than months or years.

Still, schedules are still important. If it takes two months rather than two weeks to deliver a feature then something has gone wrong and should be investigated.

What we really want is a prioritised backlog of user stories including bugs. This should be actively maintained in response to business requirements and user feedback. Upcoming stories should be sized, and this is your schedule.

### 7. Do you have a spec?
The backlog of user stories should be the spec. The *"no code without spec"* rule still applies. The difference here is that the 'spec' is more fluid. Change is to be expected and should be handled gracefully.

### 8. Do programmers have quiet working conditions?
Still true, but again perhaps not enough (seeing a trend?). A good working environment provides quiet working areas, but also collaborative spaces. It should be easy to pair program or have a team whiteboard session. Collaboration with remote workers, whether they be working at home or in a different office, is also important here.

### 9. Do you use the best tools money can buy?
Let's face it, this one is never going out of fashion. The only thing we'd add here is that there should also be budget for books and any other education the team needs.

### 10. Do you have testers?
This almost deserves a whole blog post on its own. But here goes.

By 'testers', Joel seems to mean 'manual UI testers'. This seems a bit limited. We do agree that programmers generally aren't great at manual UI testing. That's fine. Dedicated testers in this case is probably a good thing.

However, there is a *lot* more to testing than just manually testing the UI. We want to see testing as an integral part of the development process. There should be an emphasis on automated testing, with developers having an active part in the testing effort.

What we *don't* want is the development team 'throwing the code over the fence' to the QA team.

### 11. Do new candidates write code during their interview?
We have differing opinions on this one.

Thom: Agreed. It's got to be done sensibly though. If you're looking for 100% correct syntax on a whiteboard, you're definitely doing it wrong. 

Imran: Mostly agree. An exception would be interviewing non-programmers with the intent to train them. In that case, test their aptitude for CS concepts without using code.

### 12. Do you do hallway usability testing?
Probably still a good idea, for both UI and for APIs/interfaces. Perhaps a modern equivalent is A/B testing in production. This allows you to collect meaningful data from real customers.

## Next time...
