import Cookies from 'js-cookie';
import { useEffect, useState, type ReactNode } from 'react';
import ConfettiExplosion from 'react-confetti-blast';

import {
  ActionIcon, Anchor, AppShell, Badge, Box, Burger, Button, Center, Grid, Group, Menu, Modal,
  Stack, Switch, Text, UnstyledButton, useMantineColorScheme,
} from '@mantine/core';
import {
  IconBrandGithub, IconCoffee, IconHelpCircle, IconMail, IconMoon, IconSettings, IconSun,
} from '@tabler/icons-react';

import { useDisclosure, useMediaQuery } from '@mantine/hooks';

import './App.css';
import CountryForm from './CountryForm';
import Results from './CountryResults';
import GuessDistribution from './GuessDistribution';
import InfoText from './InfoText';
import SettingsProvider, { useSettings } from './SettingsProvider';
import Share from './Share';
import TitleLogo from './Title';
import wordlist from './wordlist';

import {
  correctContinent,
  correctCountry,
  correctLandlocked,
  correctPopulation,
  correctReligion,
  correctSurfaceArea,
  correctTemperatureCelsius,
  dayNumber,
  getData,
} from './country';

type CountryData = {
  continent: string;
  population: number;
  landlocked: boolean;
  religion: string;
  temperatureCelsius: number;
  surfaceArea: number;
  country: string;
};

const correctData: CountryData = {
  continent: correctContinent,
  population: correctPopulation,
  landlocked: correctLandlocked,
  religion: correctReligion,
  temperatureCelsius: correctTemperatureCelsius,
  surfaceArea: correctSurfaceArea,
  country: correctCountry,
};

const CONTACT_EMAIL = atob('aGVsbG9AZ2VvZGxlLm1l');
const GITHUB_URL = 'https://github.com/muhashi/geodle';

function VerticalText({ top, bottom }: { top: string | number; bottom: string }) {
  return (
    <Stack gap={2} align="center">
      <Text fw={600} fz="lg">{top}</Text>
      <Text fz="xs" c="dimmed" tt="uppercase">{bottom}</Text>
    </Stack>
  );
}

function pickRandomCountryData(): CountryData {
  const name = wordlist[Math.floor(Math.random() * wordlist.length)];
  const data = getData(name);
  data.country = name;
  return data;
}

type Statistics = {
  won: number;
  total: number;
  streak: number;
  longestStreak: number;
  distribution: number[];
  lastDayNumber: number;
};

const DEFAULT_STATISTICS: Statistics = {
  won: 0,
  total: 0,
  streak: 0,
  longestStreak: 0,
  distribution: [0, 0, 0, 0, 0, 0, 0],
  lastDayNumber: 0,
};

function loadStatistics(): Statistics {
  return Cookies.get('statistics') ? JSON.parse(Cookies.get('statistics')!) : DEFAULT_STATISTICS;
}

function DailyStatistics({ guessesData, isWon }: { guessesData: CountryData[]; isWon: boolean }) {
  const [statistics, setStatistics] = useState<Statistics>(loadStatistics);

  useEffect(() => {
    setStatistics((prev) => {
      if (prev.lastDayNumber === dayNumber) return prev; // already recorded today

      const updated: Statistics = { ...prev, distribution: [...prev.distribution] };
      updated.streak = isWon && updated.lastDayNumber + 1 === dayNumber ? updated.streak + 1 : (isWon ? 1 : 0);
      updated.lastDayNumber = dayNumber;
      updated.longestStreak = Math.max(updated.streak, updated.longestStreak);
      updated.won += isWon ? 1 : 0;
      updated.total += 1;
      updated.distribution[guessesData.length - 1] += isWon ? 1 : 0;

      Cookies.set('statistics', JSON.stringify(updated), { expires: 500 });
      return updated;
    });
  }, []);

  return (
    <Stack gap="lg" align="center" w="100%">
      <Text fw={600} fz="lg">Statistics</Text>

      <Group justify="space-between" w="100%" px="sm">
        <VerticalText top={statistics.total} bottom="Played" />
        <VerticalText
          top={statistics.total ? `${Math.round((statistics.won / statistics.total) * 100)}%` : '0%'}
          bottom="Win %"
        />
        <VerticalText top={statistics.streak} bottom="Streak" />
        <VerticalText top={statistics.longestStreak} bottom="Max streak" />
      </Group>

      <Box w="100%">
        <Text fw={600} mb="xs" ta="center">Guess Distribution</Text>
        <GuessDistribution
          distribution={statistics.distribution}
          userResult={guessesData.length}
          isWon={isWon}
        />
      </Box>

      <Center>
        <Text size="sm">
          Like Geodle? Try&nbsp;
          <Anchor href="https://seadle.muhashi.com/" target="_blank">
            Seadle
          </Anchor>
        </Text>
      </Center>
    </Stack>
  );
}

// Shown once a game (daily or random) is finished, in place of the guesses grid.
function CompletionPanel({
  mode,
  guessesData,
  isWon,
  onRandom,
  onHome,
}: {
  mode: GameMode;
  guessesData: CountryData[];
  isWon: boolean;
  onRandom: () => void;
  onHome: () => void;
}) {
  return (
    <Stack align="center" gap="xl" w="100%" style={{ maxWidth: 420 }}>
      {mode === 'daily' && (
        <>
          <DailyStatistics guessesData={guessesData} isWon={isWon} />
          <Share guessesData={guessesData} />
        </>
      )}

      <Group justify="center">
        <Button variant="outline" onClick={onRandom}>Play random</Button>
        <Button onClick={onHome}>Back to home</Button>
      </Group>
    </Stack>
  );
}

function WonMessage({ country }: { country: string }) {
  return (
    <>
      <Text>
        You win! The secret country was <strong>{country}</strong>!
      </Text>

      <ConfettiExplosion
        style={{ position: 'absolute', top: '50vh', left: '50vw' }}
        duration={3000}
        force={0.6}
      />
    </>
  );
}

function LostMessage({ country }: { country: string }) {
  return (
    <Text>
      You ran out of guesses! The secret country was <strong>{country}</strong>!
    </Text>
  );
}

// Question-mark icon that opens the how-to-play info in a modal, instead of
// showing it inline before the first guess.
function InfoModal() {
  const [opened, setOpened] = useState(false);

  return (
    <>
      <ActionIcon
        variant="subtle"
        color="gray"
        aria-label="How to play"
        onClick={() => setOpened(true)}
      >
        <IconHelpCircle size={20} />
      </ActionIcon>

      <Modal opened={opened} onClose={() => setOpened(false)} title="How to play" centered>
        <InfoText />
      </Modal>
    </>
  );
}

type GameMode = 'daily' | 'random';

function GamePage({
  mode,
  onHome,
  onRandom,
}: {
  mode: GameMode;
  onHome: () => void;
  onRandom: () => void;
}) {
  const [guessesData, setGuessesData] = useState<CountryData[]>([]);
  const [isWon, setIsWon] = useState(false);
  const { tempFahrenheit, areaMiles } = useSettings();

  const [target] = useState<CountryData>(() => (mode === 'daily' ? correctData : pickRandomCountryData()));

  const TOTAL_GUESSES = 7;
  const guessesLeft = TOTAL_GUESSES - guessesData.length;
  const isLost = !isWon && guessesLeft <= 0;
  const isDone = isWon || isLost;

  useEffect(() => {
    if (mode !== 'daily') return undefined;

    const lastAttempt = Cookies.get('lastAttempt');
    const lastAttemptData = Cookies.get('lastAttemptData');

    if (lastAttempt && Number(lastAttempt) === dayNumber && lastAttemptData) {
      const data: CountryData[] = JSON.parse(lastAttemptData);
      setGuessesData(data);
      setIsWon(data.some(d => d.country.toLowerCase() === correctCountry.toLowerCase()));
    }
    return undefined;
  }, []);

  useEffect(() => {
    if (mode !== 'daily') return;
    if (isWon || isLost) {
      Cookies.set('lastAttempt', dayNumber.toString(), { expires: 1 });
      Cookies.set('lastAttemptData', JSON.stringify(guessesData), { expires: 1 });
    }
  }, [mode, isWon, isLost]);

  const onSubmit = (guess: string) => {
    const clean = guess.toLowerCase().trim();
    if (!clean || guessesData.some(g => g.country.toLowerCase() === clean)) return;

    const data = getData(guess);
    data.country = guess;

    setGuessesData([...guessesData, data]);

    if (clean === target.country.toLowerCase()) {
      setIsWon(true);
    }
  };

  return (
    <Stack align="center" gap="xl" mb="10vh">
      <Group w="100%" justify="space-between">
        <Badge variant="light" color={mode === 'daily' ? 'blue' : 'grape'}>
          {mode === 'daily' ? `Daily · Country #${dayNumber}` : 'Random'}
        </Badge>
        <InfoModal />
      </Group>

      <Text ta="center" fw={500}>
        {isDone
          ? (mode === 'daily' ? 'Come back tomorrow for a new country!' : 'Nice! Ready for another one?')
          : <>Guess the country! <strong>{guessesLeft}</strong> guesses left.</>}
      </Text>

      {!isDone && (
        <CountryForm onSubmit={onSubmit} guessed={guessesData.map(({ country }) => country)} />
      )}

      {isWon && <WonMessage country={target.country} />}
      {isLost && <LostMessage country={target.country} />}

      {isDone && (
        <CompletionPanel
          mode={mode}
          guessesData={guessesData}
          isWon={isWon}
          onRandom={onRandom}
          onHome={onHome}
        />
      )}

      <Results
        guessesData={guessesData}
        correctData={target}
        isTempFahrenheit={tempFahrenheit}
        isAreaMiles={areaMiles}
      />
    </Stack>
  );
}

function Footer({
  onAbout,
  onTerms,
  onPrivacy,
}: {
  onAbout: () => void;
  onTerms: () => void;
  onPrivacy: () => void;
}) {
  return (
    <Group justify="center" gap="xs" mt="xl" pb="md">
      <Anchor component="button" type="button" size="sm" c="dimmed" onClick={onAbout}>
        About
      </Anchor>
      <Text c="dimmed" size="sm">&middot;</Text>
      <Anchor component="button" type="button" size="sm" c="dimmed" onClick={onTerms}>
        Terms of Service
      </Anchor>
      <Text c="dimmed" size="sm">&middot;</Text>
      <Anchor component="button" type="button" size="sm" c="dimmed" onClick={onPrivacy}>
        Privacy Policy
      </Anchor>
    </Group>
  );
}

function HomePage({
  onDaily,
  onRandom,
  onAbout,
  onTerms,
  onPrivacy,
}: {
  onDaily: () => void;
  onRandom: () => void;
  onAbout: () => void;
  onTerms: () => void;
  onPrivacy: () => void;
}) {
  return (
    <Stack align="center" justify="space-between" mih="75vh" py="xl">
      <Stack align="center" gap="lg" mt="8vh" style={{ maxWidth: 480 }}>
        <TitleLogo />

        <Text ta="center" c="dimmed">
          Test your geography knowledge by finding the country of the day, based on demographics
          such as population, religion, and temperature.
        </Text>

        <Group mt="md">
          <Button size="md" onClick={onDaily}>Daily</Button>
          <Button size="md" variant="outline" onClick={onRandom}>Random</Button>
        </Group>
      </Stack>

      <Footer onAbout={onAbout} onTerms={onTerms} onPrivacy={onPrivacy} />
    </Stack>
  );
}

function StaticPage({ title, onBack, children }: { title: string; onBack: () => void; children: ReactNode }) {
  return (
    <Stack mx="auto" gap="md" py="xl" style={{ maxWidth: 640 }}>
      <Anchor component="button" type="button" size="sm" onClick={onBack} style={{ alignSelf: 'flex-start' }}>
        &larr; Back to home
      </Anchor>
      <Text fz="xl" fw={700}>{title}</Text>
      <Stack gap="sm">{children}</Stack>
    </Stack>
  );
}

function AboutPage({ onBack }: { onBack: () => void }) {
  return (
    <StaticPage title="About Geodle" onBack={onBack}>
      <Text>
        Geodle is a daily geography game. Every day there&apos;s a new secret country, and you
        have seven guesses to find it. After each guess you&apos;ll see how your pick compares
        across continent, population, religion, average temperature, and more.
      </Text>
      <Text>
        Prefer not to wait for tomorrow&apos;s puzzle? Choose Random from the home screen to play
        against a freshly picked country any time.
      </Text>
    </StaticPage>
  );
}

function TermsPage({ onBack }: { onBack: () => void }) {
  return (
    <StaticPage title="Terms of Service" onBack={onBack}>
      <Text>
        Geodle is provided free of charge, as-is and without warranty of any kind. We do our best
        to keep the daily puzzle and underlying country data accurate, but we can&apos;t guarantee
        the site will always be error-free or available without interruption.
      </Text>
      <Text>
        By using this site you agree not to misuse it — for example, by attempting to disrupt the
        service or scrape it in a way that affects other players. Continued use of the site after
        changes to these terms means you accept the updated terms.
      </Text>
      <Text c="dimmed" size="sm">
        Placeholder copy — replace with your actual terms before launch.
      </Text>
    </StaticPage>
  );
}

function PrivacyPage({ onBack }: { onBack: () => void }) {
  return (
    <StaticPage title="Privacy Policy" onBack={onBack}>
      <Text>
        Geodle stores your game progress, statistics, and preferences locally in cookies on your
        device so your streak and settings persist between visits. This data isn&apos;t sent to
        any server or shared with third parties.
      </Text>
      <Text>
        We don&apos;t collect personal information, and we don&apos;t run ads or trackers on this
        site.
      </Text>
      <Text c="dimmed" size="sm">
        Placeholder copy — replace with your actual privacy policy before launch.
      </Text>
    </StaticPage>
  );
}

function SettingsModal({ opened, setOpened }: { opened: boolean; setOpened: (open: boolean) => void }) {
  const { tempFahrenheit, setTempFahrenheit, areaMiles, setAreaMiles } = useSettings();

  return (
      <Modal opened={opened} onClose={() => setOpened(false)} title="Settings" centered>
        <Switch
          checked={tempFahrenheit}
          label="Show temperatures in Fahrenheit"
          onChange={(e) => setTempFahrenheit(e.currentTarget.checked)}
        />
        <Switch
          checked={areaMiles}
          label="Show surface area in square miles"
          onChange={(e) => setAreaMiles(e.currentTarget.checked)}
          mt="md"
        />
        <Group justify="right" mt="md">
          <Button variant="outline" onClick={() => setOpened(false)}>
            Close
          </Button>
        </Group>
      </Modal>
  );
}

function DarkModeMenuItem() {
  const { colorScheme, setColorScheme } = useMantineColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <Menu.Item
      leftSection={isDark ? <IconSun size={16} /> : <IconMoon size={16} />}
      onClick={() => setColorScheme(isDark ? 'light' : 'dark')}
    >
      {isDark ? 'Light mode' : 'Dark mode'}
    </Menu.Item>
  );
}

function Header({ showLogo, onLogoClick }: { showLogo: boolean; onLogoClick: () => void }) {
  const isMobile = useMediaQuery(`(max-width: 600px)`);
  const [menuOpened, { toggle: toggleMenu, close: closeMenu }] = useDisclosure(false);
  const [displaySettings, setDisplaySettings] = useState(false);

  const titleGroup = (
    <UnstyledButton onClick={onLogoClick} aria-label="Go to home page">
      <Group justify="center" align="flex-end" gap="xs">
        <TitleLogo />
      </Group>
    </UnstyledButton>
  );

  return (
    <>
    <header style={{ textAlign: 'center', marginBottom: '20px', maxWidth: '100%', width: isMobile ? '100%' : 'auto' }}>
      <Grid justify="center" align="center">
        <Grid.Col span={1} p={0}>
          {/* empty to center */}
        </Grid.Col>
        <Grid.Col span={10} p={0}>
          {showLogo && titleGroup}
        </Grid.Col>
        <Grid.Col span={1} p={0} pr="lg">
          <Group justify="flex-end" pr="md" style={{ width: '100%' }}>
            <Menu opened={menuOpened} onChange={toggleMenu} position="bottom-start" withArrow>
              <Menu.Target>
                <Burger opened={menuOpened} onClick={toggleMenu} size="md" aria-label="Open menu" />
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item
                  leftSection={<IconSettings size={16} />}
                  onClick={() => {
                    closeMenu();
                    setDisplaySettings(true);
                  }}
                >
                  Settings
                </Menu.Item>
                <DarkModeMenuItem />
                <Menu.Divider />
                <Menu.Item
                  leftSection={<IconMail size={16} />}
                  component="a"
                  href={`mailto:${CONTACT_EMAIL}`}
                  onClick={closeMenu}
                >
                  Email us
                </Menu.Item>
                <Menu.Item
                  leftSection={<IconBrandGithub size={16} />}
                  component="a"
                  href={GITHUB_URL}
                  target="_blank"
                  onClick={closeMenu}
                >
                  GitHub
                </Menu.Item>
                <Menu.Item
                  leftSection={<IconCoffee size={16} />}
                  component="a"
                  href="https://ko-fi.com/muhashi"
                  target="_blank"
                  onClick={closeMenu}
                >
                  Donate
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Grid.Col>
      </Grid>
    </header>
    <SettingsModal opened={displaySettings} setOpened={setDisplaySettings} />
    </>
  );
}

type View = 'home' | 'daily' | 'random' | 'about' | 'terms' | 'privacy';

function Content({
  view,
  setView,
  randomSeed,
  goHome,
  goRandom,
}: {
  view: View;
  setView: (view: View) => void;
  randomSeed: number;
  goHome: () => void;
  goRandom: () => void;
}) {
  switch (view) {
    case 'daily':
      return <GamePage mode="daily" onHome={goHome} onRandom={goRandom} />;
    case 'random':
      return <GamePage key={randomSeed} mode="random" onHome={goHome} onRandom={goRandom} />;
    case 'about':
      return <AboutPage onBack={goHome} />;
    case 'terms':
      return <TermsPage onBack={goHome} />;
    case 'privacy':
      return <PrivacyPage onBack={goHome} />;
    case 'home':
    default:
      return (
        <HomePage
          onDaily={() => setView('daily')}
          onRandom={goRandom}
          onAbout={() => setView('about')}
          onTerms={() => setView('terms')}
          onPrivacy={() => setView('privacy')}
        />
      );
  }
}

export default function App() {
  const [view, setView] = useState<View>('home');
  const [randomSeed, setRandomSeed] = useState(0);

  const goHome = () => setView('home');
  const goRandom = () => {
    setRandomSeed((s) => s + 1);
    setView('random');
  };

  return (
    <div className="App">
      <SettingsProvider>
        <AppShell header={{ height: 85 }} padding="md">
          <AppShell.Header className="header">
            <Header showLogo={view !== 'home'} onLogoClick={goHome} />
          </AppShell.Header>
          <AppShell.Main>
            <Content view={view} setView={setView} randomSeed={randomSeed} goHome={goHome} goRandom={goRandom} />
          </AppShell.Main>
        </AppShell>
      </SettingsProvider>
    </div>
  );
}
