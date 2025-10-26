# Google Developer Documentation Style Guide - Full Reference

**Status**: GROUND-TRUTH SOURCE
**Created**: 2025-10-26
**Source**: https://developers.google.com/style
**Last Accessed**: 2025-10-26
**Purpose**: Authoritative reference for documentation quality audits

---

## Overview

This style guide provides editorial guidelines for writing clear and consistent Google-related developer documentation.

## Key Organizational Principles

### Reference Hierarchy

When making style decisions, consult sources in the following order:

1. **Project-specific style guidelines** (highest priority)
2. **This Google Developer Documentation Style Guide**
3. **Third-party references**:
   - Merriam-Webster (spelling)
   - Chicago Manual of Style (general writing)
   - Microsoft Writing Style Guide (technical content)

### Philosophy

> "Break any of these rules sooner than say anything outright barbarous." - George Orwell

Writers should prioritize clarity and consistency for their specific audience, departing from guidelines when appropriate.

---

## General Principles

### Accessibility

Write documentation that is accessible to all readers, including those using assistive technologies.

**Guidelines:**
- Use semantic HTML
- Provide alt text for images
- Ensure sufficient color contrast
- Structure content with proper headings
- Make interactive elements keyboard-accessible

### Inclusive Language

Use language that is inclusive and avoids bias.

**Avoid:**
- Gendered language when unnecessary
- Ableist terms (e.g., "crippled," "dummy")
- Assumptions about reader background
- Idioms that don't translate well

**Prefer:**
- Gender-neutral pronouns ("they" instead of "he/she")
- Plain language alternatives
- Universal concepts
- Clear, direct phrasing

### Avoid Jargon

Explain technical terms when first introduced. Don't assume all readers have the same technical background.

### Voice and Tone

**Active voice** is clearer and more direct than passive voice.

- ✅ "Click the button" (active)
- ❌ "The button should be clicked" (passive)

**Second person** ("you") is more engaging than third person ("the user").

- ✅ "You can configure the settings"
- ❌ "The developer can configure the settings"

**Present tense** for current functionality.

- ✅ "The function returns a string"
- ❌ "The function will return a string"

---

## Language and Grammar

### Active Voice

Use active voice to make subjects and actions clear.

**Active voice structure:** Subject → Verb → Object

Examples:
- ✅ "The service processes requests"
- ❌ "Requests are processed by the service"

### Articles (a, an, the)

Use articles appropriately:
- **a/an**: Indefinite article (any one of a group)
- **the**: Definite article (specific item)

Examples:
- "Click **a** button" (any button)
- "Click **the** Submit button" (specific button)

### Capitalization

**Title case** for document titles and section headings (capitalize major words).

**Sentence case** for most UI elements and list items (capitalize only first word).

**Interface elements:** Match the capitalization used in the actual interface.

### Contractions

Contractions are acceptable in documentation for a conversational tone.

- ✅ "You can't delete the file"
- ✅ "Don't use deprecated methods"

### Pronouns

**Second person ("you")** for addressing the reader.

**First person plural ("we")** sparingly, only when speaking as Google.

**Third person** for referring to users generally.

### Tense

**Present tense** for describing current functionality.

**Future tense** only when describing upcoming features (clearly marked).

### Sentence Structure

**Keep sentences concise.** Aim for 20-25 words or fewer.

**One idea per sentence.** Break complex thoughts into multiple sentences.

**Parallel structure** in lists and series.

---

## Punctuation

### Colons

Use colons to introduce lists, examples, or explanations.

Example: "Configure three settings: name, type, and value."

### Commas

**Serial comma (Oxford comma):** Always use.

- ✅ "API keys, tokens, and certificates"
- ❌ "API keys, tokens and certificates"

**Comma splice:** Avoid joining independent clauses with only a comma.

- ❌ "Click Save, the dialog closes"
- ✅ "Click Save; the dialog closes"
- ✅ "Click Save. The dialog closes."

### Dashes

**Em dash (—):** For parenthetical statements (no spaces around).

**En dash (–):** For ranges (no spaces around).

Examples:
- "The service—currently in beta—supports..."
- "Pages 10–20"

### Hyphens

Use hyphens for compound adjectives before nouns.

- ✅ "real-time updates"
- ✅ "command-line tool"

Don't hyphenate when the compound comes after the noun.

- ✅ "The updates occur in real time"

### Parentheses

Use sparingly. Consider whether information belongs in the main text or a note.

### Quotation Marks

**Periods and commas:** Inside quotation marks (US style).

**Colons and semicolons:** Outside quotation marks.

**Question marks and exclamation points:** Depends on context.

### Semicolons

Use semicolons to:
1. Join closely related independent clauses
2. Separate complex list items

---

## Formatting

### Dates

**Recommended format:** Month DD, YYYY

Examples:
- ✅ "January 15, 2025"
- ✅ "Jan 15, 2025" (if space is limited)

**ISO format** for machine-readable dates: YYYY-MM-DD

### Examples

**Introduce examples clearly:**
- "For example:"
- "Example:"
- "The following example shows..."

**Use code blocks** for code examples.

**Real examples** are better than placeholder examples.

### Headings

**Use descriptive headings** that clearly indicate content.

**Heading hierarchy:**
- H1: Page title (one per page)
- H2: Major sections
- H3: Subsections
- H4+: Additional levels as needed

**Don't skip levels.** Go from H2 to H3, not H2 to H4.

### Lists

**Bulleted lists** for unordered items.

**Numbered lists** for sequential steps or ranked items.

**Parallel structure:** All list items should use similar grammatical structure.

**Capitalization:**
- Sentence case for complete sentences
- Lowercase for fragments (unless proper noun)

**Punctuation:**
- Period if list item is a complete sentence
- No punctuation for fragments

### Numbers

**Spell out** numbers one through nine.

**Use numerals** for 10 and above.

**Exceptions:**
- Use numerals for measurements, percentages, coordinates
- Spell out "zero" when referring to the absence of something
- Be consistent within a sentence

### Tables

**Use tables** for data comparison or structured information.

**Table guidelines:**
- Header row for column labels
- Left-align text columns
- Right-align number columns
- Keep cells concise

### Procedures

**Numbered lists** for sequential steps.

**Action-oriented:** Start each step with a verb.

**One action per step** when possible.

Example format:
1. Click **File**.
2. Select **New Document**.
3. Enter a name.
4. Click **Create**.

---

## Computer Interfaces

### Code Comments

**Use comments** to explain non-obvious code.

**Don't comment** obvious code.

**Good comment:** Explains why, not what.

### Code Samples

**Syntax highlighting:** Use appropriate language tag.

**Complete and runnable** when possible.

**Include context:** Show imports, initialization, etc.

**Real-world examples** over toy examples.

### Command-Line Syntax

**Monospace font** for all command-line content.

**Format:**
```
command [required-arg] [optional-arg]
```

**Notation:**
- `[option]` = optional
- `<variable>` = replace with actual value
- `|` = or (choose one)

### UI Elements

**Match the interface:** Use exact text and capitalization from UI.

**Bold for clickable elements:**
- ✅ "Click **Submit**"

**Use appropriate verbs:**
- Click (buttons, links)
- Select (checkboxes, radio buttons, dropdown items)
- Enter (text fields)

---

## Names and Naming

### Example Domains

**Use approved example domains:**
- example.com
- example.org
- example.net

**Don't use real domains** that you don't control.

### Filenames

**Lowercase** with hyphens for spaces.

Examples:
- ✅ `config-file.yaml`
- ❌ `Config_File.yaml`

**Extensions:** Include appropriate file extensions.

### Trademarks

**Respect trademarks:** Use correct capitalization and formatting.

**Generic terms:** Don't use trademarked terms as generic words.

**Attribution:** When required, include trademark attribution.

---

## Platform-Specific Guidance

### Android Documentation

Special considerations for Android developers (annotated in main guide).

### Google Cloud Documentation

Special considerations for Cloud developers (annotated in main guide).

---

## Summary

This style guide prioritizes:
1. **Clarity** - Easy to understand
2. **Consistency** - Predictable patterns
3. **Accessibility** - Usable by all readers
4. **Accuracy** - Technically correct
5. **Conciseness** - No wasted words

Remember: These are guidelines, not laws. Break them when clarity demands it.

---

**Last Updated**: January 15, 2025 (as per source)
**Saved as Ground Truth**: 2025-10-26
**Use Case**: Reference for documentation quality audits
