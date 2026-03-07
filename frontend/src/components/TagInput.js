import React from 'react';
import { Autocomplete, TextField, Chip } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { tagColor as getTagColor } from '../utils/tagColors';

const TagInput = ({ value = [], onChange, disabled, existingTags = [] }) => {
  return (
    <Autocomplete
      multiple
      freeSolo
      options={existingTags.filter((t) => !value.includes(t))}
      value={value}
      onChange={(_, newValue) => onChange(newValue)}
      disabled={disabled}
      renderTags={(tagValue, getTagProps) =>
        tagValue.map((tag, index) => {
          const color = getTagColor(tag);
          return (
            <Chip
              key={tag}
              label={tag}
              size="small"
              {...getTagProps({ index })}
              sx={{
                height: 22,
                fontSize: '0.75rem',
                fontWeight: 500,
                bgcolor: alpha(color, 0.12),
                color: color,
                border: `1px solid ${alpha(color, 0.3)}`,
                '& .MuiChip-deleteIcon': {
                  color: alpha(color, 0.6),
                  fontSize: 14,
                  '&:hover': { color },
                },
              }}
            />
          );
        })
      }
      renderInput={(params) => (
        <TextField
          {...params}
          variant="outlined"
          placeholder={value.length === 0 ? 'Add tags...' : ''}
          helperText="Press Enter to add a tag"
          size="small"
        />
      )}
      ChipProps={{ size: 'small' }}
    />
  );
};

export default TagInput;
