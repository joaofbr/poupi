namespace Poupi.Application.Common;

public static class CardPalette
{
    public static readonly IReadOnlyList<string> Colors =
    [
        "#3987e5",
        "#199e70",
        "#d55181",
        "#c98500",
        "#9085e9",
        "#d95926",
        "#008300",
        "#e66767",
    ];

    public static string ForIndex(int index) => Colors[index % Colors.Count];

    public static string? Normalize(string? color)
    {
        var candidate = color?.Trim().ToLowerInvariant();
        return candidate is not null && Colors.Contains(candidate) ? candidate : null;
    }
}
