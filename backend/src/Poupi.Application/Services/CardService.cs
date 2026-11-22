using Poupi.Application.Common;
using Poupi.Application.Dtos;
using Poupi.Application.Interfaces;
using Poupi.Domain.Entities;
using Poupi.Domain.Repositories;

namespace Poupi.Application.Services;

public class CardService(ICardRepository cards, IUserRepository users) : ICardService
{
    private const int MaxNameLength = 60;

    public async Task<List<CardDto>> ListAsync(Guid householdId, CancellationToken ct = default) =>
        (await cards.ListAsync(householdId, ct)).Select(ToDto).ToList();

    public async Task<CardDto> CreateAsync(
        Guid householdId, CardInput input, CancellationToken ct = default)
    {
        var existing = await cards.ListAsync(householdId, ct);
        var card = new Card { HouseholdId = householdId, Color = CardPalette.ForIndex(existing.Count) };
        await ApplyAsync(householdId, card, input, ct);
        await cards.AddAsync(card, ct);
        await cards.SaveChangesAsync(ct);
        return ToDto(card);
    }

    public async Task<CardDto> UpdateAsync(
        Guid householdId, Guid id, CardInput input, CancellationToken ct = default)
    {
        var card = await GetOrThrowAsync(householdId, id, ct);
        await ApplyAsync(householdId, card, input, ct);
        await cards.SaveChangesAsync(ct);
        return ToDto(card);
    }

    public async Task<CardDto> SetActiveAsync(
        Guid householdId, Guid id, bool active, CancellationToken ct = default)
    {
        var card = await GetOrThrowAsync(householdId, id, ct);
        card.Active = active;
        await cards.SaveChangesAsync(ct);
        return ToDto(card);
    }

    private async Task ApplyAsync(Guid householdId, Card card, CardInput input, CancellationToken ct)
    {
        var name = input.Name?.Trim() ?? string.Empty;
        if (name.Length == 0 || name.Length > MaxNameLength)
        {
            throw new ValidationException($"Informe o nome do cartão (até {MaxNameLength} caracteres).");
        }
        if (input.ClosingDay is < 1 or > 31 || input.DueDay is < 1 or > 31)
        {
            throw new ValidationException("Os dias de fechamento e de vencimento vão de 1 a 31.");
        }

        Guid? ownerId = null;
        if (!string.IsNullOrWhiteSpace(input.OwnerId))
        {
            if (!Guid.TryParse(input.OwnerId, out var parsed)
                || await users.GetInHouseholdAsync(householdId, parsed, ct) is null)
            {
                throw new ValidationException("Integrante não encontrado.");
            }
            ownerId = parsed;
        }

        string? color = null;
        if (!string.IsNullOrWhiteSpace(input.Color))
        {
            color = CardPalette.Normalize(input.Color)
                ?? throw new ValidationException("Escolha uma das cores disponíveis para o cartão.");
        }

        card.Name = name;
        card.ClosingDay = input.ClosingDay;
        card.DueDay = input.DueDay;
        card.OwnerId = ownerId;
        if (color is not null)
        {
            card.Color = color;
        }
    }

    private async Task<Card> GetOrThrowAsync(Guid householdId, Guid id, CancellationToken ct) =>
        await cards.GetByIdAsync(householdId, id, ct)
        ?? throw new NotFoundException("Cartão não encontrado.");

    private static CardDto ToDto(Card card) => new(
        card.Id.ToString(),
        card.Name,
        card.ClosingDay,
        card.DueDay,
        card.OwnerId?.ToString(),
        card.Color,
        card.Active);
}
