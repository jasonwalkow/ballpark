const {
  useState: useBallparkState,
  useEffect: useBallparkEffect,
} = React;

const BallparkifyTool = () => {
  const [currentIdiom, setCurrentIdiom] = useBallparkState(null);
  const [idiomHistory, setIdiomHistory] = useBallparkState([]);
  const [copyFeedback, setCopyFeedback] = useBallparkState(false);

  const baseballIdioms = [
    { phrase: "Knocked it out of the park", meaning: "Achieved great success" },
    { phrase: "Hit a home run", meaning: "Accomplished something perfectly" },
    { phrase: "Stepped up to the plate", meaning: "Took responsibility or accepted a challenge" },
    { phrase: "Threw a curveball", meaning: "Surprised someone with something unexpected" },
    { phrase: "Playing hardball", meaning: "Being tough or uncompromising" },
    { phrase: "Touch all the bases", meaning: "Cover all necessary points" },
    { phrase: "Swing for the fences", meaning: "Attempt something ambitious" },
    { phrase: "In the big leagues", meaning: "At a high professional level" },
    { phrase: "Cover all the bases", meaning: "Take care of everything" },
    { phrase: "Three strikes and you're out", meaning: "Failed after three attempts" },
    { phrase: "Whole new ballgame", meaning: "Completely different situation" },
    { phrase: "Right off the bat", meaning: "Immediately from the start" },
    { phrase: "Play ball", meaning: "Get started, begin" },
    { phrase: "Out in left field", meaning: "Unusual or unconventional" },
    { phrase: "Ballpark figure", meaning: "Rough estimate" },
    { phrase: "Bush league", meaning: "Amateurish or unprofessional" },
    { phrase: "Called out", meaning: "Criticized or exposed" },
    { phrase: "Caught looking", meaning: "Surprised or unprepared" },
    { phrase: "Come out of left field", meaning: "Completely unexpected" },
    { phrase: "Rain check", meaning: "Postponement to another time" },
    { phrase: "Step up your game", meaning: "Improve your performance" },
    { phrase: "Throw in the towel", meaning: "Give up or quit" },
    { phrase: "Heavy hitter", meaning: "Powerful or influential person" },
    { phrase: "On deck", meaning: "Next in line, waiting" },
    { phrase: "Grand slam", meaning: "Major accomplishment" },
    { phrase: "Pinch hit", meaning: "Substitute for someone" },
    { phrase: "Screwball", meaning: "Eccentric or odd person" },
    { phrase: "Monday morning quarterback", meaning: "Someone who criticizes after the fact" },
    { phrase: "Southpaw", meaning: "Left-handed person" },
    { phrase: "Can of corn", meaning: "Something easy to accomplish" },
    { phrase: "Go to bat for someone", meaning: "Support or defend someone" },
    { phrase: "In someone's wheelhouse", meaning: "Within someone's area of expertise" },
    { phrase: "Swing and a miss", meaning: "Failed attempt" },
    { phrase: "Strike out", meaning: "Fail completely" },
    { phrase: "Hit it out of the park", meaning: "Exceed expectations" },
    { phrase: "Bases loaded", meaning: "High-pressure situation" },
    { phrase: "Bottom of the ninth", meaning: "Last chance" },
    { phrase: "Leadoff", meaning: "First or opening" },
    { phrase: "Rookie mistake", meaning: "Beginner's error" },
    { phrase: "Bench warmer", meaning: "Substitute who rarely plays" },
    { phrase: "Full count", meaning: "Critical moment, decision point" },
    { phrase: "Double header", meaning: "Two events back-to-back" },
    { phrase: "Rain delay", meaning: "Temporary postponement" },
    { phrase: "Seventh inning stretch", meaning: "Mid-point break" },
    { phrase: "Clear the bases", meaning: "Resolve all pending issues" },
    { phrase: "Wild pitch", meaning: "Unpredictable action" },
    { phrase: "Bunt", meaning: "Small, safe action" },
    { phrase: "Steal a base", meaning: "Take an opportunity" },
    { phrase: "Safe at home", meaning: "Successfully completed" },
    { phrase: "Tag out", meaning: "Catch someone in the act" },
    { phrase: "Foul ball", meaning: "Mistake or incorrect action" },
    { phrase: "Fair ball", meaning: "Legitimate or valid" },
    { phrase: "Infield fly", meaning: "Easy catch, simple task" },
    { phrase: "Passed ball", meaning: "Missed opportunity" },
    { phrase: "Sacrifice fly", meaning: "Help others at your own expense" },
    { phrase: "Inside pitch", meaning: "Personal or close to home" },
    { phrase: "Bean ball", meaning: "Intentional provocation" },
    { phrase: "Throw smoke", meaning: "Perform exceptionally" },
    { phrase: "Ace in the hole", meaning: "Secret advantage" },
    { phrase: "In the bullpen", meaning: "Ready and waiting" },
    { phrase: "Relief pitcher", meaning: "Someone who helps in difficult situations" },
    { phrase: "Closer", meaning: "Someone who finishes things" },
    { phrase: "Starting lineup", meaning: "Original team or plan" },
    { phrase: "Batting cleanup", meaning: "Handling important matters" },
    { phrase: "Suicide squeeze", meaning: "Risky but potentially rewarding move" },
    { phrase: "Pick off", meaning: "Catch someone off guard" },
    { phrase: "Hit the cutoff man", meaning: "Take the intermediate step" },
    { phrase: "Play pepper", meaning: "Warm up, practice" },
    { phrase: "Chest protector", meaning: "Defensive measure" },
    { phrase: "Chin music", meaning: "Intimidation" },
    { phrase: "Ducks on the pond", meaning: "Opportunities available" },
    { phrase: "Frozen rope", meaning: "Direct, powerful action" },
    { phrase: "Hot corner", meaning: "Position of pressure or attention" },
    { phrase: "Mendoza line", meaning: "Minimum acceptable standard" },
    { phrase: "No-hitter", meaning: "Perfect performance" },
    { phrase: "Perfect game", meaning: "Flawless execution" },
    { phrase: "Shut out", meaning: "Complete victory" },
    { phrase: "Walk-off", meaning: "Decisive final action" },
    { phrase: "Texas leaguer", meaning: "Lucky success" },
    { phrase: "Dying quail", meaning: "Weak but successful attempt" },
    { phrase: "Rope", meaning: "Solid hit or success" },
    { phrase: "Tater", meaning: "Home run, big win" },
    { phrase: "Baltimore chop", meaning: "Unconventional success" },
    { phrase: "Eephus pitch", meaning: "Unconventional approach" },
    { phrase: "Knuckle sandwich", meaning: "Confrontation" },
    { phrase: "Meatball", meaning: "Easy opportunity" },
    { phrase: "Uncle Charlie", meaning: "Curveball, surprise" },
    { phrase: "Yakker", meaning: "Sharp curve, tough challenge" },
    { phrase: "Green light", meaning: "Permission to proceed freely" },
    { phrase: "Hit and run", meaning: "Quick, coordinated action" },
    { phrase: "Load the bases", meaning: "Set up for major opportunity" },
    { phrase: "Clear the dugout", meaning: "Major confrontation or effort" },
    { phrase: "Rhubarb", meaning: "Argument or fight" },
    { phrase: "Around the horn", meaning: "Through all the steps" },
    { phrase: "Tools of ignorance", meaning: "Catcher's gear, essential equipment" },
    { phrase: "Warning track power", meaning: "Close but not quite enough" },
    { phrase: "Cup of coffee", meaning: "Brief stint or trial" },
    { phrase: "Five-tool player", meaning: "Complete package, well-rounded" },
    { phrase: "Rubber game", meaning: "Tiebreaker, decisive match" },
    { phrase: "Tape measure shot", meaning: "Exceptionally impressive feat" },
  ];

  const generateIdiom = () => {
    let newIdiom;
    do {
      newIdiom = baseballIdioms[Math.floor(Math.random() * baseballIdioms.length)];
    } while (currentIdiom && newIdiom.phrase === currentIdiom.phrase && baseballIdioms.length > 1);
    
    setCurrentIdiom(newIdiom);
    setIdiomHistory([newIdiom, ...idiomHistory.slice(0, 4)]);
  };

  if (!currentIdiom && baseballIdioms.length > 0) {
    generateIdiom();
  }

  const copyToClipboard = () => {
    if (currentIdiom) {
      navigator.clipboard.writeText(currentIdiom.phrase);
      setCopyFeedback(true);
    }
  };

  useBallparkEffect(() => {
    if (!copyFeedback) return;
    const t = setTimeout(() => setCopyFeedback(false), 2500);
    return () => clearTimeout(t);
  }, [copyFeedback]);

  return (
    <div className="flex flex-col md:flex-row md:h-screen min-h-screen overflow-hidden bg-bp-eyeblack">
      {/* Left: sandbox/preview */}
      <div className="flex-1 flex items-center justify-center p-4 md:p-6 overflow-auto">
        <div className="bg-bp-eyeblack rounded p-12 text-center shadow-2xl border border-bp-blue w-full h-full flex flex-col justify-center items-center">
          {currentIdiom ? (
            <>
              <div className="text-5xl mb-4">⚾</div>
              <h3 className="text-4xl text-bp-chalk mb-4">"{currentIdiom.phrase}"</h3>
              <p className="text-lg text-bp-chalk italic">{currentIdiom.meaning}</p>
            </>
          ) : (
            <p className="text-bp-chalk">Click below to generate an idiom</p>
          )}
        </div>
      </div>

      {/* Right: controls */}
      <div className="w-full md:w-[380px] bg-bp-eyeblack p-6 overflow-y-auto flex-shrink-0 border-l border-bp-eyeblack/60">
        <div className="h-full flex flex-col space-y-5">
          <section className="sticky top-0 z-10 bg-bp-eyeblack pb-4">
            <h1 className="text-lg md:text-2xl text-bp-blue font-normal">Baseball Idioms</h1>
            <p className="text-xs text-bp-chalk text-justify mt-1">
              A dugout’s worth of idioms, metaphors, and dug-in expressions pulled from the Ballpark language system.
              Use them as-is or as a springboard for new copy.
            </p>
          </section>

          {idiomHistory.length > 1 && (
            <div className="bg-bp-chalk/5 rounded px-3 py-2">
              <h3 className="text-sm text-bp-chalk mb-3">Recently Shown:</h3>
              <div className="space-y-2">
                {idiomHistory.slice(1).map((idiom, index) => (
                  <div key={index} className="text-sm text-bp-chalk flex items-start gap-2">
                    <span className="text-bp-chalk">•</span>
                    <div>
                      <span className="text-bp-chalk">"{idiom.phrase}"</span>
                      <span className="text-bp-chalk"> — {idiom.meaning}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-auto sticky bottom-0 z-10 bg-bp-eyeblack pt-4">
            <div className="flex gap-4 justify-end">
              <button
                onClick={generateIdiom}
                className="px-4 py-2 bg-bp-blue text-bp-chalk rounded transition-colors flex items-center justify-center gap-3 w-full"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <polyline points="1 4 1 10 7 10" />
                  <polyline points="23 20 23 14 17 14" />
                  <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
                </svg>
                Generate
              </button>
              {currentIdiom && (
                <button
                  onClick={copyToClipboard}
                  className="px-4 py-2 bg-bp-blue text-bp-chalk rounded transition-colors flex items-center justify-center gap-2"
                >
                  {copyFeedback ? (
                    <>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      Copied
                    </>
                  ) : (
                    <>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                      Copy
                    </>
                  )}
                </button>
              )}
            </div>
            <div className="mt-3 text-center text-xs text-bp-chalk/80">
              {baseballIdioms.length} baseball idioms in the collection
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

