import { useState } from 'react';

import { Button, ComboboxItem, Group, OptionsFilter, Select } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';

import { synonyms } from './country';
import wordlist from './wordlist';

type CountryFormProps = {
  onSubmit: (country: string) => void;
  guessed: string[];
};


function CountryForm({ onSubmit, guessed }: CountryFormProps) {
  const [country, setCountry] = useState<string | null>(null);
  const isMobile = useMediaQuery(`(max-width: 600px)`);

  const filter: OptionsFilter = ({options, search}) => {
    const clean = search.replace(/[^A-Za-z\s]/g, '').toLowerCase().trim();

    return (options as ComboboxItem[]).filter(({ label }) => {
      if (label.toLowerCase().includes(clean)) return true;

      return (
        synonyms[label as keyof typeof synonyms]?.some((s) =>
          s.toLowerCase().includes(clean)
        ) ?? false
      );
    });
  };

  return (
    <form style={{ width: '100%' }} onSubmit={(e) => { e.preventDefault(); onSubmit(country ?? ''); setCountry(null);}}>
      <Group style={{ width: '100%' }} gap="sm" wrap="nowrap" justify="center">
        <Button size="md" variant="contained" type="submit" style={{visibility: 'hidden', display: isMobile ? 'none' : 'block'}} disabled>Guess</Button> {/* hidden button for centering */}
        <Select
          data={[...wordlist].filter(country => !guessed.some((guess) => country === guess)).sort((a, b) => a.localeCompare(b))}
          autoSelectOnBlur
          searchable
          clearable
          filter={filter}
          withCheckIcon={false}
          rightSection={' '}
          comboboxProps={{ transitionProps: { transition: 'pop', duration: 200 }, shadow: 'md' }}
          placeholder="Search a country..."
          onChange={(_value, option) => setCountry(option?.value)}
          size="md"
          value={country ?? null}
        />
        <Button size="md" variant="contained" type="submit">Guess</Button>
      </Group>
    </form>
  );
}

export default CountryForm;
