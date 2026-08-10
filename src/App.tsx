import Cookies from 'js-cookie';
import { useEffect, useState, type ReactNode } from 'react';
import ConfettiExplosion from 'react-confetti-blast';

import {
  ActionIcon, Anchor, Badge, Box, Burger, Button, Center, Container, Group, Menu, Modal, Paper,
  Stack, Switch, Text, UnstyledButton, useMantineColorScheme, useMantineTheme,
} from '@mantine/core';
import {
  IconBrandGithub, IconCoffee, IconHelpCircle, IconMail, IconMoon, IconSettings, IconSun,
} from '@tabler/icons-react';

import { useDisclosure } from '@mantine/hooks';

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

// A centered item with a second item pinned to the right — used for the
// header (logo + menu) and the game screen's badge + info-icon row.
function CenterRow({ children, side }: { children: ReactNode; side?: ReactNode }) {
  return (
    <Box pos="relative" w="100%">
      <Center>{children}</Center>
      {side && (
        <Box pos="absolute" top="50%" right={0} style={{ transform: 'translateY(-50%)' }}>
          {side}
        </Box>
      )}
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Random-country selection
// ---------------------------------------------------------------------------

function pickRandomCountryData(): CountryData {
  const name = wordlist[Math.floor(Math.random() * wordlist.length)];
  const data = getData(name);
  data.country = name;
  return data;
}

// ---------------------------------------------------------------------------
// Post-game statistics + share + navigation
// ---------------------------------------------------------------------------

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

// Renders (and, once per day, records) the player's daily stats inline.
// Only used for Daily games — Random games don't affect the streak/distribution.
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
    <Stack gap="lg" w="100%">
      <Paper p="lg">
        <Group justify="space-between">
          <VerticalText top={statistics.total} bottom="Played" />
          <VerticalText
            top={statistics.total ? `${Math.round((statistics.won / statistics.total) * 100)}%` : '0%'}
            bottom="Win %"
          />
          <VerticalText top={statistics.streak} bottom="Streak" />
          <VerticalText top={statistics.longestStreak} bottom="Max streak" />
        </Group>
      </Paper>

      <Box w="100%">
        <Text fw={700} mb="xs">Guess distribution</Text>
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

// Shown once a game (daily or random) is finished, below the country stamp.
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

function CompletionStamp({
  country,
  isWon,
  guessCount,
}: {
  country: string;
  isWon: boolean;
  guessCount: number;
}) {
  const color = isWon ? 'green' : 'red';

  return (
    <Box
      style={{
        width: 220,
        height: 220,
        borderRadius: '50%',
        border: `1px dashed var(--mantine-color-${color}-5)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
      }}
    >
      <Stack
        align="center"
        justify="center"
        gap={4}
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          border: `2px solid var(--mantine-color-${color}-6)`,
        }}
      >
        <Text size="xs" fw={700} tt="uppercase" c={color} style={{ letterSpacing: 1 }}>
          {country}
        </Text>
        <Text size="xl" fw={700} c={color}>
          {isWon ? 'Found' : 'Missed'}
        </Text>
        <Text size="xs" fw={600} tt="uppercase" c={color} style={{ letterSpacing: 1 }}>
          {isWon ? `In ${guessCount} guess${guessCount === 1 ? '' : 'es'}` : 'Better luck tomorrow'}
        </Text>
      </Stack>
    </Box>
  );
}

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
      <CenterRow side={<InfoModal />}>
        <Badge>{mode === 'daily' ? `Daily · No. ${dayNumber}` : 'Random'}</Badge>
      </CenterRow>

      <Text ta="center" fw={500}>
        {isDone
          ? (mode === 'daily' ? 'Come back tomorrow for a new country!' : 'Nice! Ready for another one?')
          : <>Guess the country. <strong>{guessesLeft} guesses left.</strong></>}
      </Text>

      {!isDone && (
        <CountryForm onSubmit={onSubmit} guessed={guessesData.map(({ country }) => country)} />
      )}

      {isDone && (
        <>
          {isWon && (
            <ConfettiExplosion
              style={{ position: 'absolute', top: '50vh', left: '50vw' }}
              duration={3000}
              force={0.6}
            />
          )}
          <CompletionStamp country={target.country} isWon={isWon} guessCount={guessesData.length} />
        </>
      )}

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

// ---------------------------------------------------------------------------
// Homepage + footer + static pages
// ---------------------------------------------------------------------------

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

function HomeActionCard({
  title,
  subtitle,
  onClick,
  emphasized,
}: {
  title: string;
  subtitle: string;
  onClick: () => void;
  emphasized?: boolean;
}) {
  return (
    <UnstyledButton
      onClick={onClick}
      className="home-action-card"
      p="lg"
      style={{
        flex: 1,
        minWidth: 180,
        textAlign: 'center',
        backgroundColor: emphasized ? 'var(--mantine-color-ink-6)' : 'var(--mantine-color-body)',
        border: emphasized ? 'none' : '1px solid var(--mantine-color-ink-6)',
        borderRadius: 'var(--mantine-radius-lg)',
        transition: 'transform 0.2s ease-in-out',
      }}
    >
      <Text fw={700} fz="lg" c={emphasized ? 'white' : 'ink'}>
        {title}
      </Text>
      <Text fz="sm" c={emphasized ? 'ink.1' : 'dimmed'}>
        {subtitle}
      </Text>
    </UnstyledButton>
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
    <Stack align="center" justify="space-between" mih="70vh" py="xl">
      <Stack align="center" gap="lg" mt="6vh" style={{ maxWidth: 480 }}>
        <Text ta="center" c="dimmed">
          Guess the mystery country of the day based on demographics such as population, temperature, and religion. 
        </Text>

        <Group mt="md" w="100%" wrap="nowrap">
          <HomeActionCard title="Daily" subtitle="New country every day" onClick={onDaily} emphasized />
          <HomeActionCard title="Random" subtitle="Practice anytime" onClick={onRandom} />
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
      <Paper p="lg">
        <Stack gap="md">
          <Text fz="xl" fw={700}>{title}</Text>
          <Stack gap="sm">{children}</Stack>
        </Stack>
      </Paper>
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

// ---------------------------------------------------------------------------
// Header (logo, always visible + clickable home; menu: settings, dark mode,
// email, github, donate)
// ---------------------------------------------------------------------------

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

function LogoButton({ onClick }: { onClick: () => void }) {
  return (
    <UnstyledButton onClick={onClick} aria-label="Go to home page">
      <TitleLogo />
    </UnstyledButton>
  );
}

function Header({ onLogoClick }: { onLogoClick: () => void }) {
  const [menuOpened, { toggle: toggleMenu, close: closeMenu }] = useDisclosure(false);
  const [displaySettings, setDisplaySettings] = useState(false);

  return (
    <>
      <Box component="header" className="header" py="md">
        <CenterRow
          side={(
            <Menu opened={menuOpened} onChange={toggleMenu} position="bottom-end" withArrow>
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
                  Email
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
          )}
        >
          <LogoButton onClick={onLogoClick} />
        </CenterRow>
      </Box>
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
  // Bumped every time Random is (re)started, so GamePage remounts with a fresh country.
  const [randomSeed, setRandomSeed] = useState(0);
  const theme = useMantineTheme();

  const goHome = () => setView('home');
  const goRandom = () => {
    setRandomSeed((s) => s + 1);
    setView('random');
  };

  return (
    <Box
      className="App"
      style={{
        minHeight: '100vh',
        backgroundColor: theme.other.pageBackground,
        backgroundImage: `linear-gradient(${theme.other.gridLine} 1px, transparent 1px), linear-gradient(90deg, ${theme.other.gridLine} 1px, transparent 1px)`,
        backgroundSize: '32px 32px',
      }}
    >
      <SettingsProvider>
        <Container size="sm" px="md" py="md">
          <Header onLogoClick={goHome} />
          <Content view={view} setView={setView} randomSeed={randomSeed} goHome={goHome} goRandom={goRandom} />
        </Container>
      </SettingsProvider>
    </Box>
  );
}
