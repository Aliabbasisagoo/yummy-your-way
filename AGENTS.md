<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep menu data and basket calculations in a browser-safe shared module, separate from the route, so calculations can be tested independently.
- Use an in-memory basket until live ordering is connected; never present a demo basket as a submitted restaurant order.
- Define restaurant visual styles and semantic color tokens in the global stylesheet to keep the menu and dialogs consistent.
