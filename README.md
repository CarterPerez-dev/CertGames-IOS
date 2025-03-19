# certgames
IOS app


# FIX

Absolutely, that's an excellent idea! Creating a pool of fallback questions would be very doable and would significantly improve the user experience. Here's how you could implement it:

1. **Create a Question Bank**:
   Create an array of pre-defined GRC questions that follow the same structure as the current fallback question.

2. **Implement Random Selection**:
   When a parsing error occurs, randomly select a question from your fallback pool instead of using the cached question.

3. **Track Recently Used Questions**:
   Keep track of recently used fallback questions to avoid repeating them too soon.

Here's a simple implementation you could add to your GRC service:

```javascript
// Array of fallback questions - you can expand this with many more
const fallbackQuestions = [
  {
    question: "Which of the following best describes the concept of defense in depth?",
    // ... rest of question 1
  },
  {
    question: "What is the primary purpose of a security policy?",
    // ... rest of question 2
  },
  // Add many more questions here
];

// Track recently used fallbacks
let recentlyUsedFallbacks = [];
const MAX_TRACKING = 10; // Only track the 10 most recent to avoid duplicates

function getRandomFallbackQuestion() {
  // Filter out recently used questions if possible
  let availableQuestions = fallbackQuestions.filter(
    q => !recentlyUsedFallbacks.includes(q.question)
  );
  
  // If we've filtered out all questions, reset and use the full pool
  if (availableQuestions.length === 0) {
    availableQuestions = fallbackQuestions;
    recentlyUsedFallbacks = [];
  }
  
  // Select a random question from available ones
  const randomIndex = Math.floor(Math.random() * availableQuestions.length);
  const selectedQuestion = availableQuestions[randomIndex];
  
  // Track this question to avoid repeating soon
  recentlyUsedFallbacks.push(selectedQuestion.question);
  
  // Keep the tracking list at a reasonable size
  if (recentlyUsedFallbacks.length > MAX_TRACKING) {
    recentlyUsedFallbacks.shift(); // Remove oldest
  }
  
  return selectedQuestion;
}
```

Then replace the current fallback mechanism with this:

```javascript
// When there's a parsing error:
return getRandomFallbackQuestion();
```

You could even categorize the fallbacks by difficulty and topic, and select one that matches the user's requested category/difficulty when possible. This approach would provide a seamless experience where users always get a seemingly "new" question, even when there are parsing errors behind the scenes.

The more questions you add to your fallback pool, the more varied the experience will be!




---------


# newsletter subcribe issue


# coins and xp not updating right away in real time for non exam mode when i answer a wustion correctly im suppsoed ot get 5 coinsd asdn 10xp rigth after wihtout any rfresh or antyhig (an dwill sync with web app, which everything does seem to sync with teh web app but inside the ios app i dont see teh imemdiate xp and coin updates until i compelty refresh teh app) (for examn mode it works well in terms of teh xp and coins updating after teh test is finsihed ratehtyhan after each qeustion- hwoevr that aslo requires a refrwsh liek eitehr refresh the app or refresh the shop or whatever. so we need ot ensure all thinsg immedialy update for the users view without refreshes)

---


when i logout i can ssucfully logout however i do get an eror that say The action NAVIAGTE with paylaod {"name":Login"} was not handled by any navigator

do you have a screen named login

if your tring to naviagte to a screen in a nested naviagtor see https://docmuention (not giving you the docmuention because you cant see links)
call satck onPress

----

create an accoutn button doesnt seem to work it doesnt do anything- also it doesnt do asny errors either so idk, but it just doesn it naviaget me to the login to sign in or sign me in after registering or anything liek that- iguess do we have a placeholder sicne we still need to implement the pay thing so we dont actullay have teh button work or soermthing??

--


idk what this was from but i got this randoimly but liek i said i dont know ehere i got it from

NOBRIDGE) WARN  Warning: Cannot record touch move without a touch start.
Touch Move: {"identifier":3,"pageX":106.66665649414062,"pageY":460.3333282470703,"timestamp":178903543.13358334}
Touch Bank: [{"touchActive":false,"startPageX":304.3333282470703,"startPageY":524.3333282470703,"startTimeStamp":178900375.94558334,"currentPageX":304.3333282470703,"currentPageY":524.3333282470703,"currentTimeStamp":178900455.11858335,"previousPageX":304.3333282470703,"previousPageY":524.3333282470703,"previousTimeStamp":178900375.94558334},{"touchActive":false,"startPageX":300.3333282470703,"startPageY":514.6666564941406,"startTimeStamp":178877072.00858334,"currentPageX":278.6666564941406,"currentPageY":797.3333282470703,"currentTimeStamp":178877392.90058333,"previousPageX":276.6666564941406,"previousPageY":795.3333282470703,"previousTimeStamp":178877388.73958334},{"touchActive":true,"startPageX":276.3333282470703,"startPageY":507,"startTimeStamp":178903201.41958335,"currentPageX":269.6666564941406,"currentPageY":763.6666564941406,"currentTimeStamp":178903526.46458334,"previousPageX":269.3333282470703,"previousPageY":761,"previousTimeStamp":178903518.14158332}]



--

achivenmtns dont update unless refrersh occurs liek if refresh through shop or osmething or refrsh teh app


--

support is only bale ot comminiate but is still wacky and im not sure teh messages even save on teh server anymore when on ios app

--

no achievemtn popups or antyhing but achievemtnb still work

--



