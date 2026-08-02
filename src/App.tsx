import Cookies from 'js-cookie';
import { useEffect, useState } from 'react';
import ConfettiExplosion from 'react-confetti-blast';

import { ActionIcon, Anchor, Box, Burger, Button, Center, Grid, Group, Menu, Modal, Stack, Switch, Text } from '@mantine/core';
import { IconCoffee, IconSettings } from '@tabler/icons-react';

import { useDisclosure, useMediaQuery } from '@mantine/hooks';

import './App.css';
import CountryForm from './CountryForm';
import Results from './CountryResults';
import GuessDistribution from './GuessDistribution';
import InfoText from './InfoText';
import SettingsProvider, { useSettings } from './SettingsProvider';
import Share from './Share';
import TitleLogo from './Title';

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

function VerticalText({ top, bottom }: { top: string | number; bottom: string }) {
  return (
    <Stack gap={2} align="center">
      <Text fw={600} fz="lg">{top}</Text>
      <Text fz="xs" c="dimmed" tt="uppercase">{bottom}</Text>
    </Stack>
  );
}

function GameStatisticsModal({
  guessesData,
  isWon,
}: {
  guessesData: CountryData[];
  isWon: boolean;
}) {
  const [opened, setOpened] = useState(false);

  const statistics = Cookies.get('statistics')
    ? JSON.parse(Cookies.get('statistics')!)
    : {
        won: 0,
        total: 0,
        streak: 0,
        longestStreak: 0,
        distribution: [0, 0, 0, 0, 0, 0, 0],
        lastDayNumber: 0,
      };

  useEffect(() => {
    setTimeout(() => setOpened(true), 2000);

    if (statistics.lastDayNumber !== dayNumber) {
      statistics.streak =
        isWon && statistics.lastDayNumber + 1 === dayNumber
          ? statistics.streak + 1
          : isWon
          ? 1
          : 0;

      statistics.lastDayNumber = dayNumber;
      statistics.longestStreak = Math.max(statistics.streak, statistics.longestStreak);
      statistics.won += isWon ? 1 : 0;
      statistics.total += 1;
      statistics.distribution[guessesData.length - 1] += isWon ? 1 : 0;

      Cookies.set('statistics', JSON.stringify(statistics), { expires: 500 });
    }
  }, []);

  return (
    <Modal opened={opened} onClose={() => setOpened(false)} title="Statistics" centered>
      <Stack gap="lg">
        <Group justify="apart">
          <VerticalText top={statistics.total} bottom="Played" />
          <VerticalText
            top={`${Math.round((statistics.won / statistics.total) * 100)}%`}
            bottom="Win %"
          />
          <VerticalText top={statistics.streak} bottom="Streak" />
          <VerticalText top={statistics.longestStreak} bottom="Max streak" />
        </Group>

        <Box>
          <Text fw={600} mb="xs">Guess Distribution</Text>
          <GuessDistribution
            distribution={statistics.distribution}
            userResult={guessesData.length}
            isWon={isWon}
          />
        </Box>

        <Group justify="center">
          <Share guessesData={guessesData} />
        </Group>

        <Center>
          <Text size="sm">
            Like Geodle? Try&nbsp;
            <Anchor href="https://seadle.muhashi.com/" target="_blank">
              Seadle
            </Anchor>
          </Text>
        </Center>
      </Stack>
    </Modal>
  );
}

/* -------------------- Win / Lose messages -------------------- */

function WonMessage({ guessesData }: { guessesData: CountryData[] }) {
  return (
    <>
      <Text>
        You win! The secret country was <strong>{correctCountry}</strong>!
      </Text>

      <ConfettiExplosion
        style={{ position: 'absolute', top: '50vh', left: '50vw' }}
        duration={3000}
        force={0.6}
      />

      <GameStatisticsModal guessesData={guessesData} isWon />
      <Share guessesData={guessesData} />
    </>
  );
}

function LostMessage({ guessesData }: { guessesData: CountryData[] }) {
  return (
    <>
      <Text>
        You ran out of guesses! The secret country was <strong>{correctCountry}</strong>!
      </Text>

      <GameStatisticsModal guessesData={guessesData} isWon={false} />
      <Share guessesData={guessesData} />
    </>
  );
}

function Main() {
  const [guessesData, setGuessesData] = useState<CountryData[]>([]);
  const [isWon, setIsWon] = useState(false);
  const { tempFahrenheit, areaMiles } = useSettings();

  const TOTAL_GUESSES = 7;
  const guessesLeft = TOTAL_GUESSES - guessesData.length;
  const isLost = !isWon && guessesLeft <= 0;

  useEffect(() => {
    const lastAttempt = Cookies.get('lastAttempt');
    const lastAttemptData = Cookies.get('lastAttemptData');

    if (lastAttempt && Number(lastAttempt) === dayNumber && lastAttemptData) {
      const data: CountryData[] = JSON.parse(lastAttemptData);
      setGuessesData(data);
      setIsWon(data.some(d => d.country.toLowerCase() === correctCountry.toLowerCase()));
    }
  }, []);

  useEffect(() => {
    if (isWon || isLost) {
      Cookies.set('lastAttempt', dayNumber.toString(), { expires: 1 });
      Cookies.set('lastAttemptData', JSON.stringify(guessesData), { expires: 1 });
    }
  }, [isWon, isLost]);

  const onSubmit = (guess: string) => {
    const clean = guess.toLowerCase().trim();
    if (!clean || guessesData.some(g => g.country.toLowerCase() === clean)) return;

    const data = getData(guess);
    data.country = guess;

    setGuessesData([...guessesData, data]);

    if (clean === correctCountry.toLowerCase()) {
      setIsWon(true);
    }
  };

  return (
    <Stack align="center" gap="xl" mb="10vh">
      <Text ta="center" fw={500}>
        {(isWon || isLost)
          ? 'Come back tomorrow for a new country!'
          : <>Guess the country! <strong>{guessesLeft}</strong> guesses left.</>}
      </Text>

      {!isWon && !isLost && (
        <CountryForm onSubmit={onSubmit} guessed={guessesData.map(({country}) => country)} />
      )}

      {isWon && <WonMessage guessesData={guessesData} />}
      {isLost && <LostMessage guessesData={guessesData} />}

      <Results guessesData={guessesData} correctData={correctData} isTempFahrenheit={tempFahrenheit} isAreaMiles={areaMiles} />

      {guessesData.length === 0 && <InfoText />}
    </Stack>
  );
}

function SettingsButton() {
  const [opened, setOpened] = useState(false);

  return (
    <>
      <ActionIcon variant="transparent" c="#002a4a" onClick={() => setOpened(true)} size="lg">
        <IconSettings />
      </ActionIcon>
      <SettingsModal opened={opened} setOpened={setOpened} />
    </>
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

function Header() {
  const isMobile = useMediaQuery(`(max-width: 600px)`);
  const [menuOpened, { toggle: toggleMenu, close: closeMenu }] = useDisclosure(false);
  const [displaySettings, setDisplaySettings] = useState(false);

  const kofiLink = (
    <Anchor
      style={{ cursor: 'pointer' }}
      href="https://ko-fi.com/muhashi"
      target="_blank"
      underline="never"
      title="Buy me a coffee <3"
    >
      <IconCoffee className="kofi-hover" />
    </Anchor>
  );

  const titleGroup = (
    <Group justify="center" align="flex-end" gap="xs" style={{ marginBottom: '8px' }}>
      {!isMobile && <Text style={{ visibility: 'hidden' }}>by muhashi</Text>}
      <TitleLogo />
      <Text fs="italic" c="dimmed">
        by <Anchor c="blue" href="https://muhashi.com/" target="_blank" underline="always">muhashi</Anchor>
      </Text>
    </Group>
  );

  return (
    <>
    <header style={{ textAlign: 'center', marginBottom: '20px', maxWidth: '100%', width: isMobile ? '100%' : 'auto' }}>
      <Stack gap="xs" style={{ width: '100%' }}>
        {isMobile && (
          <Group justify="flex-end" pr="md" style={{ width: '100%' }}>
            <Menu opened={menuOpened} onChange={toggleMenu} position="bottom-end" withArrow>
              <Menu.Target>
                <Burger opened={menuOpened} onClick={toggleMenu} size="sm" aria-label="Open menu" />
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
        )}

        <Grid justify="center" align="flex-end">
          {!isMobile && (
            <Grid.Col span={1}>
              {kofiLink}
            </Grid.Col>
          )}
          <Grid.Col span={isMobile ? 12 : 10}>
            {titleGroup}
          </Grid.Col>
          {!isMobile && (
            <Grid.Col span={1}>
              <SettingsButton />
            </Grid.Col>
          )}
        </Grid>
      </Stack>
    </header>
    <SettingsModal opened={displaySettings} setOpened={setDisplaySettings} />
    </>
  );
}

export default function App() {
  return (
    <SettingsProvider>
      <Stack mih="95vh" align="center" pt="md">
        <Header />
        <Main />
      </Stack>
    </SettingsProvider>
  );
}
