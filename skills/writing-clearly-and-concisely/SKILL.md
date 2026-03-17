---
name: writing-clearly-and-concisely
description: Use when writing any prose humans will read — documentation, README files, commit messages, error messages, PR descriptions, UI copy, help text, reports, summaries, or explanations. Applies Strunk's timeless rules for clearer, stronger, more professional writing. Use this even for short text like error messages, log messages, or inline comments. If you're writing sentences for a human to read, use this skill.
---

# Writing Clearly and Concisely

## Limited Context Strategy

When context is tight:

1. Write your draft using judgment
2. Dispatch a subagent with your draft and the relevant section file
3. Have the subagent copyedit and return the revision

Loading a single section (~1,000-4,500 tokens) instead of everything saves significant context.

## Elements of Style

William Strunk Jr.'s *The Elements of Style* (1918) teaches you to write clearly and cut ruthlessly.

### Rules

**Elementary Rules of Usage (Grammar/Punctuation)**:

1. Form possessive singular by adding 's
2. Use comma after each term in series except last
3. Enclose parenthetic expressions between commas
4. Comma before conjunction introducing co-ordinate clause
5. Don't join independent clauses by comma
6. Don't break sentences in two
7. Participial phrase at beginning refers to grammatical subject

**Elementary Principles of Composition**:

8. One paragraph per topic
9. Begin paragraph with topic sentence
10. **Use active voice**
11. **Put statements in positive form**
12. **Use definite, specific, concrete language**
13. **Omit needless words**
14. Avoid succession of loose sentences
15. Express co-ordinate ideas in similar form
16. **Keep related words together**
17. Keep to one tense in summaries
18. **Place emphatic words at end of sentence**

### Reference Files

The rules above are summarized from Strunk's original text. For complete explanations with examples:

| Section | File | ~Tokens |
|---------|------|---------|
| Grammar, punctuation, comma rules | `elements-of-style/01-elementary-rules-of-usage.md` | 2,500 |
| Paragraph structure, active voice, concision | `elements-of-style/02-elementary-principles-of-composition.md` | 4,500 |
| Headings, quotations, formatting | `elements-of-style/03-a-few-matters-of-form.md` | 1,000 |
| Word choice, common errors | `elements-of-style/04-words-and-expressions-commonly-misused.md` | 4,000 |

**Most tasks need only `elements-of-style/02-elementary-principles-of-composition.md`** — it covers active voice, positive form, concrete language, and omitting needless words.

## AI Writing Patterns

After writing, use the `humanizer` skill to scan for and remove AI writing patterns — puffery, empty phrases, promotional adjectives, overused AI vocabulary, and formatting overuse. The humanizer has a comprehensive, severity-ranked pattern catalog specifically tuned for Claude output.

## Bottom Line

Writing for humans? Load the relevant section from `elements-of-style/` and apply the rules. For most tasks, `elements-of-style/02-elementary-principles-of-composition.md` covers what matters most.
